import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Play, Trash2, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mediaUrls, timeToSec, useCases, vault, type CaseFile } from "@/lib/vault-store";
import { AskPanel } from "@/components/AskPanel";

export const Route = createFileRoute("/case/$id")({
  head: () => ({
    meta: [
      { title: "Case File — PhantomVault AI" },
      { name: "description", content: "Investigate transcript, timeline and mystery clues from a heritage recording." },
      { property: "og:title", content: "Case File — PhantomVault AI" },
      { property: "og:description", content: "Investigate transcript, timeline and mystery clues from a heritage recording." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CasePage,
});

function CasePage() {
  const { id } = Route.useParams();
  const c = useCases().find((x) => x.id === id);
  if (!c)
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl text-foreground">This case has vanished.</h1>
        <Link to="/" className="mt-4 inline-block text-primary">Back to the vault</Link>
      </main>
    );
  return <CaseView c={c} />;
}

function CaseView({ c }: { c: CaseFile }) {
  const navigate = useNavigate();
  const media = mediaUrls.get(c.id);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [kind, setKind] = useState("All");
  const [q, setQ] = useState("");

  const seek = (t: string) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = timeToSec(t);
    mediaRef.current.play();
  };
  const kinds = ["All", ...Array.from(new Set(c.clues.map((x) => x.kind)))];
  const clues = c.clues.map((cl, i) => ({ ...cl, i })).filter((cl) => kind === "All" || cl.kind === kind);

  const toggleSolved = (i: number) =>
    vault.update(c.id, { clues: c.clues.map((cl, j) => (j === i ? { ...cl, solved: !cl.solved } : cl)) });

  const highlighted = q.trim()
    ? c.transcript.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
    : [c.transcript];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Vault</Link>
        <Button variant="ghost" size="sm" onClick={() => { vault.remove(c.id); navigate({ to: "/" }); }}>
          <Trash2 className="h-4 w-4" /> Delete case
        </Button>
      </div>

      <p className="mt-6 font-mono text-xs text-accent">CASE #{c.id.slice(0, 6).toUpperCase()} · {c.fileName}</p>
      <input
        className="mt-2 w-full bg-transparent font-display text-4xl text-foreground outline-none md:text-5xl"
        value={c.title}
        onChange={(e) => vault.update(c.id, { title: e.target.value })}
        aria-label="Case title"
      />
      <p className="mt-4 max-w-3xl text-muted-foreground">{c.summary}</p>

      {media ? (
        media.isVideo ? (
          <video ref={(el) => { mediaRef.current = el; }} src={media.url} controls className="mt-6 w-full max-w-2xl rounded-md" />
        ) : (
          <audio ref={(el) => { mediaRef.current = el; }} src={media.url} controls className="mt-6 w-full max-w-2xl" />
        )
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">Media playback is only available in the session it was uploaded.</p>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Clue explorer */}
        <section className="lg:col-span-2">
          <h2 className="text-3xl text-foreground">Mystery Clue Explorer</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 text-xs ${kind === k ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {k}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {clues.map((cl) => (
              <article key={cl.i} className={`evidence-card p-4 transition ${cl.solved ? "opacity-60" : "hover:shadow-spectral"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">{cl.kind}</span>
                  <button onClick={() => seek(cl.time)} className="flex items-center gap-1 font-mono text-xs text-primary" disabled={!media}>
                    <Play className="h-3 w-3" />≈{cl.time}
                  </button>
                </div>
                <h3 className="mt-2 text-lg text-foreground">{cl.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{cl.detail}</p>
                {cl.quote && <blockquote className="mt-2 border-l-2 border-primary/60 pl-3 text-sm italic text-foreground/80">“{cl.quote}”</blockquote>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="spectral" onClick={() => setQ(cl.quote?.split(" ").slice(0, 3).join(" ") || cl.title)}>
                    <SearchIcon className="h-3 w-3" /> Find in transcript
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleSolved(cl.i)}>
                    <Check className="h-3 w-3" /> {cl.solved ? "Reopen" : "Mark solved"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-3xl text-foreground">Timeline</h2>
          <ol className="mt-4 space-y-3 border-l border-primary/40 pl-4">
            {c.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary shadow-glow" />
                <button onClick={() => seek(t.time)} className="font-mono text-xs text-primary">≈{t.time}</button>
                <p className="text-sm text-foreground">{t.event}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">Timestamps are AI estimates.</p>
        </section>
      </div>

      {/* Metadata */}
      <section className="mt-12 evidence-card p-6">
        <h2 className="text-2xl text-foreground">Case metadata <span className="text-sm text-muted-foreground">(editable)</span></h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(["era", "location", "language"] as const).map((f) => (
            <label key={f} className="text-xs uppercase tracking-wider text-muted-foreground">
              {f}
              <Input className="mt-1" value={c[f]} onChange={(e) => vault.update(c.id, { [f]: e.target.value })} />
            </label>
          ))}
          <label className="text-xs uppercase tracking-wider text-muted-foreground md:col-span-3">
            Keywords (comma separated)
            <Input className="mt-1" value={c.keywords.join(", ")} onChange={(e) => vault.update(c.id, { keywords: e.target.value.split(",").map((s) => s.trim()) })} />
          </label>
          <label className="text-xs uppercase tracking-wider text-muted-foreground md:col-span-3">
            Recurring names
            <Input className="mt-1" value={c.people.join(", ")} onChange={(e) => vault.update(c.id, { people: e.target.value.split(",").map((s) => s.trim()) })} />
          </label>
          <label className="text-xs uppercase tracking-wider text-muted-foreground md:col-span-3">
            Detective notes
            <Textarea className="mt-1" rows={3} value={c.notes} onChange={(e) => vault.update(c.id, { notes: e.target.value })} placeholder="Who recorded this? What do you know about it?" />
          </label>
        </div>
      </section>

      {/* Transcript + ask */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl text-foreground">Transcript</h2>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search words…" className="max-w-[200px]" />
          </div>
          <div className="mt-4 max-h-[480px] overflow-y-auto evidence-card p-5 font-mono text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {highlighted.map((part, i) => (i % 2 === 1 ? <mark key={i} className="rounded bg-primary/30 px-0.5 text-foreground">{part}</mark> : part))}
          </div>
        </section>
        <section>
          <h2 className="text-3xl text-foreground">Interrogate the tape</h2>
          <AskPanel sources={[c]} placeholder="e.g. Who is the old woman mentioned at the well?" />
        </section>
      </div>
    </main>
  );
}
