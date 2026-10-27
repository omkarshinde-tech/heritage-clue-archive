import { createFileRoute, Link } from "@tanstack/react-router";
import { FileAudio, Search, KeyRound, Clock } from "lucide-react";
import hero from "@/assets/vault-hero.jpg";
import { UploadEvidence } from "@/components/UploadEvidence";
import { useCases } from "@/lib/vault-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PhantomVault AI — Haunted Heritage Detective" },
      { name: "description", content: "Turn old recordings into searchable mystery archives with transcripts, timelines and clues." },
      { property: "og:title", content: "PhantomVault AI — Haunted Heritage Detective" },
      { property: "og:description", content: "Turn old recordings into searchable mystery archives with transcripts, timelines and clues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const cases = useCases();
  return (
    <main>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Old tape recorder on a candlelit archive desk" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-veil" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-28">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Case archive · open source</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-tight text-foreground md:text-7xl">
            Every forgotten tape <span className="text-primary">hides a story.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            PhantomVault listens to old audio and video, then builds transcripts, timelines and clues you can investigate. No ghosts detected — just memories recovered.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-4">
        {[
          { i: FileAudio, t: "Transcribe", d: "Speech recognition recovers every word." },
          { i: Clock, t: "Timeline", d: "Events mapped to moments in the recording." },
          { i: KeyRound, t: "Clue Explorer", d: "Names, objects and references as clues." },
          { i: Search, t: "Search & Ask", d: "Question your whole archive." },
        ].map(({ i: I, t, d }) => (
          <div key={t} className="evidence-card p-5">
            <I className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-xl text-foreground">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <UploadEvidence />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl text-foreground">The Vault</h2>
        {cases.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No case files yet. Submit your first recording above.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((c) => (
              <Link key={c.id} to="/case/$id" params={{ id: c.id }} className="evidence-card group p-5 transition hover:border-primary/60 hover:shadow-glow">
                <p className="font-mono text-xs text-accent">CASE #{c.id.slice(0, 6).toUpperCase()}</p>
                <h3 className="mt-2 text-xl text-foreground group-hover:text-primary">{c.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.summary}</p>
                <p className="mt-3 text-xs text-muted-foreground">{c.era} · {c.clues.length} clues</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
