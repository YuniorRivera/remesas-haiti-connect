import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Extract node_modules to vendor chunks
          if (id.includes('node_modules')) {
            // React core (critical, load first)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI primitives (Radix)
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Heavy PDF libraries (lazy load)
            if (id.includes('jspdf') || id.includes('qrcode') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            // Chart libraries
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // p5.js animations (optional, heavy)
            if (id.includes('p5')) {
              return 'p5-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Supabase client
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increased limit
    // Optimize chunk loading
    cssCodeSplit: true,
    // Source maps only in dev
    sourcemap: process.env.NODE_ENV === 'development',
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
      ],
    },
  },
}));
