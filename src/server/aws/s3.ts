import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.mjs";

const BUCKET = "snapify-videos" as const;
const READ_URL_TTL_SECONDS = 15 * 60;
const UPLOAD_URL_TTL_SECONDS = 60 * 60;
const idPattern = /^[a-zA-Z0-9_-]+$/;

const client = new S3Client({
  endpoint: env.AWS_ENDPOINT,
  region: env.AWS_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.AWS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const assertId = (value: string, label: string) => {
  if (!idPattern.test(value)) throw new Error(`Invalid ${label}`);
  return value;
};

const keysFor = (userId: string, videoId: string) => {
  const safeUserId = assertId(userId, "user id");
  const safeVideoId = assertId(videoId, "video id");
  const prefix = `users/${safeUserId}/videos/${safeVideoId}`;
  return { video: `${prefix}.video`, thumbnail: `${prefix}.png` };
};

export type VideoContentType = "video/webm" | "video/mp4";

export const storage = {
  bucket: BUCKET,

  async createUploadUrls(
    userId: string,
    videoId: string,
    contentType: VideoContentType,
    size: number
  ) {
    const keys = keysFor(userId, videoId);
    const [signedVideoUrl, signedThumbnailUrl] = await Promise.all([
      getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: keys.video,
          ContentType: contentType,
          ContentLength: size,
        }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS }
      ),
      getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: keys.thumbnail,
          ContentType: "image/png",
        }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS }
      ),
    ]);
    return { signedVideoUrl, signedThumbnailUrl };
  },

  async createReadUrls(userId: string, videoId: string) {
    const keys = keysFor(userId, videoId);
    const [videoUrl, thumbnailUrl] = await Promise.all([
      getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: BUCKET, Key: keys.video }),
        { expiresIn: READ_URL_TTL_SECONDS }
      ),
      getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: BUCKET, Key: keys.thumbnail }),
        { expiresIn: READ_URL_TTL_SECONDS }
      ),
    ]);
    return { videoUrl, thumbnailUrl };
  },

  async createThumbnailReadUrl(userId: string, videoId: string) {
    const { thumbnail } = keysFor(userId, videoId);
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: BUCKET, Key: thumbnail }),
      { expiresIn: READ_URL_TTL_SECONDS }
    );
  },

  async deleteVideo(userId: string, videoId: string) {
    const keys = keysFor(userId, videoId);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Quiet: true,
          Objects: [{ Key: keys.video }, { Key: keys.thumbnail }],
        },
      })
    );
  },
};
