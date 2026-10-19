import { z } from "zod";
import {
  roundSchema,
  sessionResetEventSchema,
} from "../../features/game/api/schemas";

export const notificationChannel = "canopy_game_updates";
export const notificationSchema = z.strictObject({
  sessionHash: z.string().regex(/^[a-f0-9]{64}$/),
  event: z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("round"), data: roundSchema }),
    z.strictObject({ type: z.literal("reset"), data: sessionResetEventSchema }),
  ]),
});
export type GameNotification = z.infer<typeof notificationSchema>;
