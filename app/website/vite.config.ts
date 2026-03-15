import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: resolve(rootDir, "index.html"),
        downloads: resolve(rootDir, "downloads/index.html"),
        features: resolve(rootDir, "features/index.html"),
        workflow: resolve(rootDir, "workflow/index.html"),
        tutorials: resolve(rootDir, "tutorials/index.html"),
        screenshots: resolve(rootDir, "screenshots/index.html"),
        about: resolve(rootDir, "about/index.html")
      }
    }
  }
});
