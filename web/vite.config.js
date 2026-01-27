import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import eslintPlugin from "vite-plugin-eslint";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: env.VITE_BASE_PATH || "/",

    server: {
      host: true,
      port: 3002,
    },

    build: {
      target: "esnext",
      chunkSizeWarningLimit: 2048,
    },

    resolve: {
      alias: {
        "@app": path.resolve(__dirname, "./src/app"),
        "@css": path.resolve(__dirname, "./src/css"),
        "@lib": path.resolve(__dirname, "./src/library"),
      },
    },

    plugins: [eslintPlugin()],
  };
});
