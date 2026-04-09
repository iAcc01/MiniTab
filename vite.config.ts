import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type PluginOption } from "vite"
import pkg from "./package.json" with { type: "json" }

const isCrx = process.env.BUILD_CRX === "true"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let crxPlugin: any = null
if (isCrx) {
  const { crx } = await import("@crxjs/vite-plugin")
  const manifest = (await import("./manifest.json", { with: { type: "json" } })).default
  crxPlugin = crx({ manifest })
}

const plugins: PluginOption[] = [react()]
if (crxPlugin) {
  plugins.push(crxPlugin)
}

export default defineConfig({
  plugins,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
})
