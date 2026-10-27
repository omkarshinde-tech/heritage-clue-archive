import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const analyzeFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ transcript: z.string().min(1).max(200000), durationSec: z.number(), fileName: z.string().max(300) }),
  )
  .handler(async ({ data }) => {
    const { analyzeTranscript } = await import("./ai/phantom.server");
    try {
      return { ok: true as const, analysis: await analyzeTranscript(data) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });

export const askFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      question: z.string().min(1).max(1000),
      sources: z.array(z.object({ id: z.string(), title: z.string(), transcript: z.string() })).max(20),
    }),
  )
  .handler(async ({ data }) => {
    const { askArchive } = await import("./ai/phantom.server");
    try {
      return { ok: true as const, answer: await askArchive(data) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });
