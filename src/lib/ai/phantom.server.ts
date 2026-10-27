import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./gateway-helpers";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const ANALYSIS_MODEL = "google/gemini-4-argon";
const TRANSCRIBE_MODEL = "openai/gpt-transcribe";
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

export class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function apiKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new GatewayError(500, "AI is not configured (missing key).");
  return key;
}

function toGatewayError(err: unknown): GatewayError {
  const e = err as { statusCode?: number; status?: number; message?: string; responseBody?: string };
  const status = e?.statusCode ?? e?.status ?? 500;
  if (status === 402) return new GatewayError(402, "AI credits are exhausted. Add credits in workspace billing to keep investigating.");
  if (status === 429) return new GatewayError(429, "The spirits are busy (rate limited). Please wait a moment and try again.");
  let msg = e?.message ?? "AI request failed";
  try {
    const body = e?.responseBody ? JSON.parse(e.responseBody) : null;
    msg = body?.error?.message ?? body?.message ?? msg;
  } catch {
    /* ignore */
  }
  return new GatewayError(status, msg);
}

/* ---------------- Transcription ---------------- */

export async function transcribeMedia(file: File): Promise<string> {
  if (!file.size || file.size > MAX_MEDIA_BYTES) throw new GatewayError(400, "File must be under 25 MB.");
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/"))
    throw new GatewayError(400, "Please upload an audio or video file.");
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("file", file, file.name);
  form.append("response_format", "json");
  form.append("stream", "true");
  const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  if (!res.ok || !res.body) {
    let msg = `Transcription failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? j?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new GatewayError(res.status, res.status === 402 ? "AI credits are exhausted. Add credits to continue." : msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let done = "";
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += dec.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const f of frames) {
      const line = f.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "transcript.text.delta") text += ev.delta ?? "";
        if (ev.type === "transcript.text.done") done = ev.text ?? "";
        if (ev.type === "error") throw new GatewayError(500, ev.error?.message ?? "Transcription error");
      } catch (e) {
        if (e instanceof GatewayError) throw e;
      }
    }
  }
  const out = (done || text).trim();
  if (!out) throw new GatewayError(422, "No speech could be heard in this recording.");
  return out;
}

/* ---------------- Analysis ---------------- */

const analysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  era: z.string(),
  location: z.string(),
  language: z.string(),
  keywords: z.array(z.string()),
  people: z.array(z.string()),
  timeline: z.array(z.object({ time: z.string(), event: z.string() })),
  clues: z.array(
    z.object({
      kind: z.string(),
      title: z.string(),
      detail: z.string(),
      quote: z.string(),
      time: z.string(),
    }),
  ),
});
export type Analysis = z.infer<typeof analysisSchema>;

function fmt(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export async function analyzeTranscript(input: { transcript: string; durationSec: number; fileName: string }) {
  const provider = createLovableAiGatewayProvider(apiKey(), undefined, { baseURL: GATEWAY });
  const prompt = `You are a careful heritage archivist analysing an old recording for a Halloween-themed "mystery archive".
Never claim anything supernatural is real; treat eerie elements as folklore or storytelling.

File: ${input.fileName}
Duration: ${fmt(input.durationSec)} (${Math.round(input.durationSec)} seconds)

Transcript:
"""
${input.transcript.slice(0, 60000)}
"""

Return JSON with:
- title: evocative but accurate case title (max 8 words)
- summary: 3-5 sentence summary of the story/content
- era: likely time period, or "Unknown"
- location: places referenced, or "Unknown"
- language: spoken language
- keywords: 6-12 important keywords
- people: recurring names / speakers mentioned
- timeline: 4-10 chronological events. "time" is an ESTIMATED timestamp m:ss within the recording, based on where the words fall proportionally in the transcript and the total duration.
- clues: 4-8 "mystery clues". kind is one of: Moment, Object, Name, Place, Historical Reference, Folklore. quote is a short exact quote from the transcript. time is an estimated m:ss.`;
  try {
    const result = streamText({
      model: provider(ANALYSIS_MODEL),
      output: Output.object({ schema: analysisSchema }),
      prompt,
      maxRetries: 0,
    });
    return (await result.output) as Analysis;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err) && err.text) {
      const m = err.text.match(/\{[\s\S]*\}/);
      if (m) {
        const parsed = analysisSchema.safeParse(JSON.parse(m[0]));
        if (parsed.success) return parsed.data;
      }
      throw new GatewayError(502, "The analysis came back garbled. Try again.");
    }
    throw toGatewayError(err);
  }
}

/* ---------------- Q&A ---------------- */

export async function askArchive(input: {
  question: string;
  sources: { id: string; title: string; transcript: string }[];
}) {
  const provider = createLovableAiGatewayProvider(apiKey(), undefined, { baseURL: GATEWAY });
  const context = input.sources
    .map((s) => `### Case "${s.title}" (id ${s.id})\n${s.transcript.slice(0, 20000)}`)
    .join("\n\n");
  try {
    const result = streamText({
      model: provider(ANALYSIS_MODEL),
      maxRetries: 0,
      system:
        "You are PhantomVault's detective assistant. Answer ONLY from the provided recording transcripts. Quote evidence briefly and name which case it came from. If the answer isn't in the recordings, say the evidence is silent. Never claim real supernatural activity. Keep answers under 180 words.",
      prompt: `${context}\n\nQuestion: ${input.question}`,
    });
    const text = (await result.text).trim();
    if (!text) throw new GatewayError(502, "No answer was returned.");
    return text;
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    throw toGatewayError(err);
  }
}
