import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import {
  canAttemptSharePin,
  grantShareAccess,
  hashSharePin,
  hasShareAccess,
  sharePinPattern,
  verifySharePin,
} from "~/server/shareAccess";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const folderRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.folder.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        sharing: true,
        sharePinHash: true,
        _count: { select: { videos: true } },
      },
    }).then((folders) =>
      folders.map(({ sharePinHash, ...folder }) => ({
        ...folder,
        pinProtected: !!sharePinHash,
      }))
    )
  ),

  get: publicProcedure
    .input(z.object({ folderId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const folder = await ctx.prisma.folder.findUnique({
        where: { id: input.folderId },
        include: {
          user: { select: { name: true, image: true } },
          videos: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = folder.userId === ctx.session?.user.id;
      if (!isOwner && !folder.sharing) throw new TRPCError({ code: "FORBIDDEN" });

      const authorized =
        isOwner ||
        !folder.sharePinHash ||
        hasShareAccess(ctx.req, "folder", folder.id, folder.shareAccessVersion);

      if (!authorized) {
        return {
          locked: true as const,
          id: folder.id,
          name: folder.name,
          isOwner: false as const,
        };
      }

      const videos = await Promise.all(
        folder.videos.map(async (video) => ({
          id: video.id,
          title: video.title,
          createdAt: video.createdAt,
          thumbnailUrl: await ctx.storage.createThumbnailReadUrl(video.userId, video.id),
        }))
      );

      return {
        locked: false as const,
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        sharing: folder.sharing,
        pinProtected: !!folder.sharePinHash,
        isOwner,
        user: folder.user,
        videos,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(120) }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.folder.create({
        data: { name: input.name, userId: ctx.session.user.id },
      })
    ),

  rename: protectedProcedure
    .input(z.object({ folderId: z.string().cuid(), name: z.string().trim().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      await ownedFolder(ctx, input.folderId);
      return ctx.prisma.folder.update({
        where: { id: input.folderId },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ folderId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ownedFolder(ctx, input.folderId);
      await ctx.prisma.$transaction([
        ctx.prisma.video.updateMany({
          where: { folderId: input.folderId },
          data: { folderId: null },
        }),
        ctx.prisma.folder.delete({ where: { id: input.folderId } }),
      ]);
      return { success: true };
    }),

  setSharing: protectedProcedure
    .input(z.object({ folderId: z.string().cuid(), sharing: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ownedFolder(ctx, input.folderId);
      return ctx.prisma.folder.update({
        where: { id: input.folderId },
        data: {
          sharing: input.sharing,
          ...(!input.sharing ? { shareAccessVersion: { increment: 1 } } : {}),
        },
      });
    }),

  setPin: protectedProcedure
    .input(
      z.object({
        folderId: z.string().cuid(),
        pin: z.string().regex(sharePinPattern).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ownedFolder(ctx, input.folderId);
      return ctx.prisma.folder.update({
        where: { id: input.folderId },
        data: {
          sharePinHash: input.pin ? await hashSharePin(input.pin) : null,
          shareAccessVersion: { increment: 1 },
        },
      });
    }),

  setVideoFolder: protectedProcedure
    .input(
      z.object({
        videoId: z.string().cuid(),
        folderId: z.string().cuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.prisma.video.findFirst({
        where: { id: input.videoId, userId: ctx.session.user.id },
      });
      if (!video) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.folderId) await ownedFolder(ctx, input.folderId);
      return ctx.prisma.video.update({
        where: { id: input.videoId },
        data: { folderId: input.folderId },
      });
    }),

  unlock: publicProcedure
    .input(
      z.object({
        folderId: z.string().cuid(),
        pin: z.string().regex(sharePinPattern),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const folder = await ctx.prisma.folder.findUnique({ where: { id: input.folderId } });
      if (!folder || !folder.sharing || !folder.sharePinHash) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!(await canAttemptSharePin(ctx.req, `folder:${folder.id}`))) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      if (!(await verifySharePin(input.pin, folder.sharePinHash))) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorreto" });
      }

      grantShareAccess(ctx.req, ctx.res, "folder", folder.id, folder.shareAccessVersion);
      return { success: true };
    }),
});

type OwnedFolderContext = {
  prisma: PrismaClient;
  session: { user: { id: string } };
};

async function ownedFolder(ctx: OwnedFolderContext, folderId: string) {
  const folder = await ctx.prisma.folder.findFirst({
    where: { id: folderId, userId: ctx.session.user.id },
  });
  if (!folder) throw new TRPCError({ code: "FORBIDDEN" });
  return folder;
}
