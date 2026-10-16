import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { storage } from "~/server/aws/s3";

const BATCH_SIZE = 50;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!env.CRON_SECRET) {
    return res.status(503).json({ error: "Cron is not configured" });
  }

  if (req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const expiredVideos = await prisma.video.findMany({
    where: {
      sharing: true,
      shareLinkExpiresAt: { lte: new Date() },
    },
    orderBy: { shareLinkExpiresAt: "asc" },
    take: BATCH_SIZE,
  });

  let disabled = 0;
  let deleted = 0;
  let failed = 0;

  for (const video of expiredVideos) {
    try {
      if (video.delete_after_link_expires) {
        await storage.deleteVideo(video.userId, video.id);
        await prisma.video.delete({ where: { id: video.id } });
        deleted += 1;
      } else {
        await prisma.video.update({
          where: { id: video.id },
          data: { sharing: false },
        });
        disabled += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("Failed to clean expired video", video.id, error);
    }
  }

  return res.status(failed > 0 ? 207 : 200).json({
    processed: expiredVideos.length,
    disabled,
    deleted,
    failed,
    hasMore: expiredVideos.length === BATCH_SIZE,
  });
}
