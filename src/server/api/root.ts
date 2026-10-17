import { createTRPCRouter } from "~/server/api/trpc";
import { videoRouter } from "~/server/api/routers/video";
import { folderRouter } from "~/server/api/routers/folder";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  video: videoRouter,
  folder: folderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
