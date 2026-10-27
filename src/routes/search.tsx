import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { AskPanel } from "@/components/AskPanel";
import { useCases } from "@/lib/vault-store";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search & Ask the Archive — PhantomVault AI" },
      { name: "description", content: "Search every transcript, clue and keyword, and ask questions across your whole archive." },
      { property: "og:title", content: "Search & Ask the Archive — PhantomVault AI" },
      { property: "og:description", content: "Search transcripts, clues and keywords across all recordings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const cases = useCases();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return cases.flatMap((c) => {
      const hits: { where: string; text: string }[] = [];
      const idx = c.transcript.toLowerCase().indexOf(term);
      if (idx >= 0) hits.push({ where: "Transcript", text: "…" + c.transcript.slice(Math.max(0, idx - 60), idx + 100) + "…" });
      c.clues.forEach((cl) => {
        if (`${cl.title} ${cl.detail} ${cl.quote}`.toLowerCase().includes(term)) hits.push({ where: `Clue · ${cl.kind}`, text: cl.title });
      });
      if ([...c.keywords, ...c.people, c.era, c.location].some((k) => k.toLowerCase().includes(term)))
        hits.push({ where: "Metadata", text: [...c.keywords, ...c.people].join(", ") });
      return hits.length ? [{ c, hits }] : [];
    });
  }, [q, cases]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-5xl text-foreground">Search the archive</h1>
      <p className="mt-2 text-muted-foreground">{cases.length} case file{cases.length === 1 ? "" : "s"} in the vault.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="A name, place, object, song…" />
          <div className="mt-4 space-y-3">
            {q && results.length === 0 && <p className="text-sm text-muted-foreground">The evidence is silent.</p>}
            {results.map(({ c, hits }) => (
              <Link key={c.id} to="/case/$id" params={{ id: c.id }} className="block evidence-card p-4 hover:border-primary/60">
                <h3 className="text-xl text-foreground">{c.title}</h3>
                {hits.slice(0, 3).map((h, i) => (
                  <p key={i} className="mt-1 text-sm text-muted-foreground"><span className="font-mono text-xs text-accent">{h.where}</span> {h.text}</p>
                ))}
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-3xl text-foreground">Ask across all recordings</h2>
          <AskPanel sources={cases} placeholder={cases.length ? "Which recordings mention a harvest festival?" : "Upload a recording first"} />
        </section>
      </div>
    </main>
  );
}
