import { defineConfig } from "vite";

const rawPort = process.env.PORT ?? "5174";
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

export default defineConfig({
  root: import.meta.dirname,
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port,
  },
});
