import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  canAttemptSharePin,
  grantShareAccess,
  hashSharePin,
  hasShareAccess,
  sharePinPattern,
  verifySharePin,
} from "~/server/shareAccess";

const videoContentType = z.enum(["video/webm", "video/mp4"]);

export const videoRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const videos = await ctx.prisma.video.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { folder: { select: { id: true, name: true } } },
    });

    return Promise.all(
      videos.map(async (video) => ({
        ...video,
        thumbnailUrl: await ctx.storage.createThumbnailReadUrl(
          video.userId,
          video.id
        ),
      }))
    );
  }),

  get: publicProcedure
    .input(z.object({ videoId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findUnique({
        where: { id: input.videoId },
        include: {
          user: { select: { name: true, image: true } },
          folder: true,
        },
      });
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = video.userId === ctx.session?.user.id;
      const videoShareIsActive =
        video.sharing &&
        (!video.shareLinkExpiresAt || video.shareLinkExpiresAt > new Date());
      const folderShareIsActive = !!video.folder?.sharing;
      const videoShareAuthorized =
        videoShareIsActive &&
        (!video.sharePinHash ||
          hasShareAccess(ctx.req, "video", video.id, video.shareAccessVersion));
      const folderShareAuthorized =
        !!video.folder &&
        folderShareIsActive &&
        (!video.folder.sharePinHash ||
          hasShareAccess(
            ctx.req,
            "folder",
            video.folder.id,
            video.folder.shareAccessVersion
          ));

      if (!isOwner && !videoShareAuthorized && !folderShareAuthorized) {
        if (folderShareIsActive && video.folder?.sharePinHash) {
          return {
            locked: true as const,
            id: video.id,
            title: video.title,
            isOwner: false as const,
            unlockScope: "folder" as const,
            folder: { id: video.folder.id, name: video.folder.name },
          };
        }
        if (videoShareIsActive && video.sharePinHash) {
          return {
            locked: true as const,
            id: video.id,
            title: video.title,
            isOwner: false as const,
            unlockScope: "video" as const,
            folder: null,
          };
        }
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { videoUrl, thumbnailUrl } = await ctx.storage.createReadUrls(
        video.userId,
        video.id
      );

      const publicVideo = {
        locked: false as const,
        id: video.id,
        title: video.title,
        createdAt: video.createdAt,
        user: video.user,
        video_url: videoUrl,
        thumbnailUrl,
        folder:
          video.folder && (isOwner || folderShareIsActive)
            ? { id: video.folder.id, name: video.folder.name }
            : null,
      };

      if (!isOwner) {
        return { ...publicVideo, isOwner: false as const };
      }

      return {
        ...publicVideo,
        sharing: video.sharing,
        delete_after_link_expires: video.delete_after_link_expires,
        shareLinkExpiresAt: video.shareLinkExpiresAt,
        linkShareSeo: video.linkShareSeo,
        pinProtected: !!video.sharePinHash,
        isOwner: true as const,
      };
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        key: z.string().trim().min(1).max(200),
        contentType: videoContentType,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.create({
        data: { userId: ctx.session.user.id, title: input.key },
      });

      try {
        const urls = await ctx.storage.createUploadUrls(
          video.userId,
          video.id,
          input.contentType
        );
        return { success: true, id: video.id, ...urls };
      } catch (error) {
        await ctx.prisma.video.delete({ where: { id: video.id } });
        throw error;
      }
    }),

  abortUpload: protectedProcedure
    .input(z.object({ videoId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const video = await ownedVideo(ctx, input.videoId);
      await ctx.storage.deleteVideo(video.userId, video.id);
      await ctx.prisma.video.delete({ where: { id: video.id } });
      return { success: true };
    }),

  setSharing: protectedProcedure
    .input(z.object({ videoId: z.string().cuid(), sharing: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ownedVideo(ctx, input.videoId);
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: {
          sharing: input.sharing,
          ...(!input.sharing ? { shareAccessVersion: { increment: 1 } } : {}),
        },
      });
    }),

  setPin: protectedProcedure
    .input(
      z.object({
        videoId: z.string().cuid(),
        pin: z.string().regex(sharePinPattern).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ownedVideo(ctx, input.videoId);
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: {
          sharePinHash: input.pin ? await hashSharePin(input.pin) : null,
          shareAccessVersion: { increment: 1 },
        },
      });
    }),

  unlock: publicProcedure
    .input(
      z.object({
        videoId: z.string().cuid(),
        pin: z.string().regex(sharePinPattern),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findUnique({ where: { id: input.videoId } });
      const shareIsActive =
        !!video?.sharing &&
        (!video.shareLinkExpiresAt || video.shareLinkExpiresAt > new Date());
      if (!video || !shareIsActive || !video.sharePinHash) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!(await canAttemptSharePin(ctx.req, `video:${video.id}`))) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      if (!(await verifySharePin(input.pin, video.sharePinHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorreto" });
      }

      grantShareAccess(ctx.req, ctx.res, "video", video.id, video.shareAccessVersion);
      return { success: true };
    }),

  setDeleteAfterLinkExpires: protectedProcedure
    .input(
      z.object({
        videoId: z.string().cuid(),
        delete_after_link_expires: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ownedVideo(ctx, input.videoId);
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: { delete_after_link_expires: input.delete_after_link_expires },
      });
    }),

  setShareLinkExpiresAt: protectedProcedure
    .input(
      z.object({
        videoId: z.string().cuid(),
        shareLinkExpiresAt: z.date().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ownedVideo(ctx, input.videoId);
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: { shareLinkExpiresAt: input.shareLinkExpiresAt },
      });
    }),

  renameVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.string().cuid(),
        title: z.string().trim().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ownedVideo(ctx, input.videoId);
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: { title: input.title },
      });
    }),

  deleteVideo: protectedProcedure
    .input(z.object({ videoId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const video = await ownedVideo(ctx, input.videoId);
      await ctx.storage.deleteVideo(video.userId, video.id);
      await ctx.prisma.video.delete({ where: { id: video.id } });
      return { success: true };
    }),
});

type OwnedVideoContext = {
  prisma: PrismaClient;
  session: { user: { id: string } };
};

async function ownedVideo(ctx: OwnedVideoContext, videoId: string) {
  const video = await ctx.prisma.video.findFirst({
    where: { id: videoId, userId: ctx.session.user.id },
  });
  if (!video) throw new TRPCError({ code: "FORBIDDEN" });
  return video;
}
