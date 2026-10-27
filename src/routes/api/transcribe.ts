import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { transcribeMedia, GatewayError } = await import("@/lib/ai/phantom.server");
        try {
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) return Response.json({ error: "No file uploaded." }, { status: 400 });
          const text = await transcribeMedia(file);
          return Response.json({ text });
        } catch (e) {
          const status = e instanceof GatewayError ? e.status : 500;
          return Response.json({ error: (e as Error).message }, { status });
        }
      },
    },
  },
});
