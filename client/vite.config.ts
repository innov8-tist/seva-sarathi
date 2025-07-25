import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [TanStackRouterVite(), react(), tailwindcss() ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@server": path.resolve(__dirname, "../server"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: "http://localhost:8000",
                changeOrigin: true,
            }
        }
    }
})

