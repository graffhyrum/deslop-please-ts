import indexHtml from "./index.html";
import { createStore } from "./store.ts";
import { createApiHandler } from "./routes.ts";

const store = createStore();
const apiHandler = createApiHandler(store);

function startServer(port: number): ReturnType<typeof Bun.serve> {
  return Bun.serve({
    port,
    routes: {
      "/": indexHtml,
      "/api/*": (request) => apiHandler(request),
    },
  });
}

export { startServer, createStore };
