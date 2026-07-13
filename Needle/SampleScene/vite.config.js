import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression2';
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'

export default defineConfig(async ({ command }) => {

    const { needlePlugins, useGzip, loadConfig } = await import("@needle-tools/engine/plugins/vite/index.js");
    const needleConfig = await loadConfig();

    return {
        base: "./",
        plugins: [
            react(),
            basicSsl(),
            useGzip(needleConfig) ? viteCompression({ deleteOriginalAssets: true, algorithms: ['gzip']}) : null,
            needlePlugins(command, needleConfig, { noBuildPipeline: !!process.env.VERCEL }),
        ],
        esbuild: {
            loader: 'jsx',
            include: /src\/react-game\/.*\.js$/,
            exclude: [],
        },
        optimizeDeps: {
            esbuildOptions: {
                loader: {
                    '.js': 'jsx',
                },
            },
        },
        server: {
            // ── DO NOT ADD A PROXY BLOCK HERE ──────────────────────────
            // A previous "proxy" entry routed localhost:3000 → localhost:3000
            // creating a request loop that broke texture loading and HMR.
            // To work around Vite's HTTP/2 session memory timeouts, we
            // simply force HTTP/1.1 via the `http` flag below.
            // ───────────────────────────────────────────────────────────
            https: true,
            host: true,           // bind to 0.0.0.0 so Unity can reach it on any interface
            strictPort: true,
            port: 3000,
        },
        build: {
            outDir: "./dist",
            emptyOutDir: true,
        }
    }
});