import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '137.184.162.109',
      'draw2play.xyz',
      '.draw2play.xyz' // Allows subdomains too
    ],
    hmr: {
      host: 'draw2play.xyz'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
});
