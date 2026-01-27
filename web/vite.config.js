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
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          login: path.resolve(__dirname, "login.html"),
          signup: path.resolve(__dirname, "signup.html"),
        },
      },
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
