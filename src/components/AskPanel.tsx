import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askFn } from "@/lib/phantom.functions";
import type { CaseFile } from "@/lib/vault-store";

type Msg = { role: "you" | "vault"; text: string; error?: boolean };

export function AskPanel({ sources, placeholder }: { sources: CaseFile[]; placeholder: string }) {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask() {
    const question = q.trim();
    if (!question || busy || sources.length === 0) return;
    setQ("");
    setMsgs((m) => [...m, { role: "you", text: question }]);
    setBusy(true);
    try {
      const r = await askFn({
        data: { question, sources: sources.slice(0, 20).map((s) => ({ id: s.id.slice(0, 6), title: s.title, transcript: s.transcript })) },
      });
      setMsgs((m) => [...m, r.ok ? { role: "vault", text: r.answer } : { role: "vault", text: r.error, error: true }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "vault", text: (e as Error).message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 evidence-card flex flex-col p-4">
      <div className="max-h-[400px] min-h-[160px] space-y-3 overflow-y-auto">
        {msgs.length === 0 && <p className="text-sm text-muted-foreground">Ask anything about the recordings. Answers cite the evidence.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "you" ? "text-right" : ""}>
            <div className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-md px-3 py-2 text-left text-sm ${m.role === "you" ? "bg-primary/15 text-foreground" : m.error ? "bg-destructive/15 text-destructive" : "bg-secondary text-foreground"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && <p className="flex items-center gap-2 text-sm text-accent"><Loader2 className="h-4 w-4 animate-spin" />Consulting the archive…</p>}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} disabled={sources.length === 0} />
        <Button type="submit" variant="ember" disabled={busy || !q.trim() || sources.length === 0} aria-label="Ask">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
