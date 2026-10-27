import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeFn } from "@/lib/phantom.functions";
import { mediaUrls, vault } from "@/lib/vault-store";

function getDuration(url: string, isVideo: boolean) {
  return new Promise<number>((resolve) => {
    const el = document.createElement(isVideo ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve(isFinite(el.duration) ? el.duration : 0);
    el.onerror = () => resolve(0);
    el.src = url;
  });
}

export function UploadEvidence() {
  const input = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"idle" | "listening" | "analyzing">("idle");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handle(file: File) {
    setError(null);
    if (file.size > 25 * 1024 * 1024) return setError("That recording is over 25 MB. Try a shorter clip.");
    const isVideo = file.type.startsWith("video/");
    const url = URL.createObjectURL(file);
    try {
      setStage("listening");
      const durationSec = await getDuration(url, isVideo);
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const tj = await res.json();
      if (!res.ok) throw new Error(tj.error || "Transcription failed");
      setStage("analyzing");
      const r = await analyzeFn({ data: { transcript: tj.text, durationSec, fileName: file.name } });
      if (!r.ok) throw new Error(r.error);
      const id = crypto.randomUUID();
      mediaUrls.set(id, { url, isVideo });
      vault.add({
        id,
        createdAt: Date.now(),
        fileName: file.name,
        durationSec,
        transcript: tj.text,
        notes: "",
        ...r.analysis,
      });
      navigate({ to: "/case/$id", params: { id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setStage("idle");
    }
  }

  const busy = stage !== "idle";
  return (
    <div className="evidence-card border-dashed border-primary/40 p-8 text-center">
      <input
        ref={input}
        type="file"
        accept="audio/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <h3 className="text-2xl text-foreground">Submit new evidence</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Upload an old recording — oral history, folk song, family video (audio/MP4, up to 25 MB).
      </p>
      <Button variant="ember" size="lg" className="mt-6" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {stage === "listening" ? "Listening to the tape…" : stage === "analyzing" ? "Gemini 4 is investigating…" : "Open a case file"}
      </Button>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
