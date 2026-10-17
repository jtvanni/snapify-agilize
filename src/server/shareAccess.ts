import {
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { env } from "~/env.mjs";
import { sharePinRateLimit } from "~/server/rateLimit";

export const SHARE_ACCESS_TTL_SECONDS = 15 * 60;
export const sharePinPattern = /^\d{4}$/;

type ShareScope = "folder" | "video";
type ShareGrant = {
  scope: ShareScope;
  id: string;
  version: number;
  expiresAt: number;
};
type ShareGrantPayload = { grants: ShareGrant[] };

const COOKIE_NAME = "snapify-share-access";
const localAttempts = new Map<string, number[]>();

const scrypt = (value: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(value, salt, 32, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

export async function hashSharePin(pin: string) {
  if (!sharePinPattern.test(pin)) throw new Error("PIN_INVALID");
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(pin, salt);
  return `scrypt:${salt}:${key.toString("base64url")}`;
}

export async function verifySharePin(pin: string, storedHash: string) {
  if (!sharePinPattern.test(pin)) return false;
  const [algorithm, encodedSalt, encodedKey] = storedHash.split(":");
  if (algorithm !== "scrypt" || !encodedSalt || !encodedKey) return false;

  const expected = Buffer.from(encodedKey, "base64url");
  const actual = await scrypt(pin, encodedSalt);
  return (
    expected.length === actual.length &&
    timingSafeEqual(new Uint8Array(expected), new Uint8Array(actual))
  );
}

const signingSecret = () =>
  createHmac("sha256", env.NEXTAUTH_SECRET ?? "snapify-development-secret")
    .update("share-access-v1")
    .digest("hex");

const encodePayload = (payload: ShareGrantPayload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
};

const decodePayload = (token?: string): ShareGrantPayload => {
  if (!token) return { grants: [] };
  const [body, providedSignature] = token.split(".");
  if (!body || !providedSignature) return { grants: [] };

  const expectedSignature = createHmac("sha256", signingSecret()).update(body).digest();
  const actualSignature = Buffer.from(providedSignature, "base64url");
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(
      new Uint8Array(expectedSignature),
      new Uint8Array(actualSignature)
    )
  ) {
    return { grants: [] };
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ShareGrantPayload;
    return Array.isArray(parsed.grants) ? parsed : { grants: [] };
  } catch {
    return { grants: [] };
  }
};

export function hasShareAccess(
  req: NextApiRequest,
  scope: ShareScope,
  id: string,
  version: number
) {
  const now = Date.now();
  return decodePayload(req.cookies[COOKIE_NAME]).grants.some(
    (grant) =>
      grant.scope === scope &&
      grant.id === id &&
      grant.version === version &&
      grant.expiresAt > now
  );
}

export function grantShareAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  scope: ShareScope,
  id: string,
  version: number
) {
  const now = Date.now();
  const grants = decodePayload(req.cookies[COOKIE_NAME]).grants
    .filter((grant) => grant.expiresAt > now && !(grant.scope === scope && grant.id === id))
    .slice(-9);

  grants.push({
    scope,
    id,
    version,
    expiresAt: now + SHARE_ACCESS_TTL_SECONDS * 1000,
  });

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodePayload({ grants })}; Max-Age=${SHARE_ACCESS_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`
  );
}

export async function canAttemptSharePin(req: NextApiRequest, target: string) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() ??
    req.socket.remoteAddress ??
    "unknown";
  const key = `${target}:${ip}`;

  if (sharePinRateLimit) {
    return (await sharePinRateLimit.limit(key)).success;
  }

  const cutoff = Date.now() - 5 * 60 * 1000;
  const attempts = (localAttempts.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (attempts.length >= 5) return false;
  attempts.push(Date.now());
  localAttempts.set(key, attempts);
  return true;
}
