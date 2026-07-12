// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 -- static files first, SSR for the
// rest. Run `bun run build` before starting. Restart it with `bun run publish`.
import handler from "./dist/server/server.js";
import { routeApi, serveUploadedFile } from "./src/api/router";
import { PORT, HOST, CLIENT_DIR } from "./src/api/middleware";

const freePort = "for _ in $(seq 1 25); do pids=$(lsof -t -iTCP:" + String(PORT) + " -sTCP:LISTEN 2>/dev/null || true); if [ -z \"$pids\" ]; then exit 0; fi; kill $pids 2>/dev/null || true; sleep 0.2; done";

// Server
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname } = new URL(req.url);

        // API routes (via modular router)
        const apiResponse = await routeApi(req);
        if (apiResponse) return apiResponse;

        // Serve uploaded files
        const uploadedFile = await serveUploadedFile(pathname);
        if (uploadedFile) return uploadedFile;

        // Static files
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) return new Response(file);
        }

        // TanStack Start SSR
        return (handler as { fetch: (r: Request) => Response | Promise<Response> }).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}
console.log("team-site serving on http://" + HOST + ":" + String(PORT));