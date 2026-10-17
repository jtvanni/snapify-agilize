import { z } from "zod";

import { MAX_VIDEO_BYTES } from "~/utils/videoLimits";

export const videoUploadInput = z.object({
  key: z.string().trim().min(1).max(200),
  contentType: z.enum(["video/webm", "video/mp4"]),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_VIDEO_BYTES, "O vídeo deve ter no máximo 48 MB."),
});
