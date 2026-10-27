import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — PhantomVault AI" },
      { name: "description", content: "Why PhantomVault exists: preserving oral histories, folk songs and family recordings." },
      { property: "og:title", content: "About — PhantomVault AI" },
      { property: "og:description", content: "Preserving oral histories, folk songs and family recordings with AI." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">The mission</p>
      <h1 className="mt-3 text-5xl text-foreground">Recovering voices, not ghosts.</h1>
      <div className="mt-8 space-y-5 text-muted-foreground">
        <p>Old recordings — oral histories, folk songs, forgotten family videos — hold cultural memory. Without transcripts, context or metadata, they stay silent on a shelf.</p>
        <p>PhantomVault transcribes each recording, then uses Google's Gemini 4 model to summarise the story, extract keywords and names, estimate a timeline, and surface "clues" worth investigating. You can correct any metadata and add your own notes.</p>
        <p className="evidence-card p-4 text-sm">
          <span className="text-primary">Disclaimer:</span> The Halloween theme is storytelling. PhantomVault does not and cannot detect supernatural activity. Timeline timestamps are AI estimates.
        </p>
        <p className="text-sm">Case files are stored in this browser. Media files are only kept for the current session.</p>
      </div>
    </main>
  );
}
