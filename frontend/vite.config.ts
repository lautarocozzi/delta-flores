import { defineConfig, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const backendTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8080";

// Spring rejects any Origin that is not in its localhost allowlist with 403
// "Invalid CORS request". The browser only talks to this dev server, so drop
// Origin before forwarding.
function proxyToBackend(): ProxyOptions {
  return {
    target: backendTarget,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.removeHeader("origin");
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8081,
    // Host publishes 5173 → container 8081. Without clientPort, another
    // machine tries HMR on localhost or :8081 and gets connection refused.
    hmr: {
      clientPort: 5173,
      protocol: "ws",
    },
    proxy: {
      "/api": proxyToBackend(),
      // POST /login is the Spring auth endpoint. GET /login is the SPA route.
      "/login": {
        ...proxyToBackend(),
        bypass(req) {
          if (req.method !== "POST") {
            return "/index.html";
          }
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
