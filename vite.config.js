import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/android/**', '**/dist/**', '**/*.apk']
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        sandbox: path.resolve(__dirname, 'sandbox.html')
      }
    }
  },
  plugins: [
    {
      name: 'copy-js-assets',
      closeBundle() {
        const root = process.cwd();
        const jsDir = path.resolve(root, 'js');
        const distJsDir = path.resolve(root, 'dist/js');
        if (fs.existsSync(jsDir)) {
          copyDir(jsDir, distJsDir);
        }
      }
    }
  ]
});
