import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function staticInstallerPlugin(): Plugin {
  return {
    name: 'serve-static-installer-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url) {
          const cleanUrl = req.url.split('?')[0];
          if (cleanUrl.endsWith('.exe') || cleanUrl.endsWith('.zip') || cleanUrl.endsWith('.ico') || cleanUrl.endsWith('.bat')) {
            const filePath = path.join(__dirname, 'public', cleanUrl);
            if (fs.existsSync(filePath)) {
              const stat = fs.statSync(filePath);
              const contentType = cleanUrl.endsWith('.exe')
                ? 'application/x-msdownload'
                : cleanUrl.endsWith('.zip')
                ? 'application/zip'
                : cleanUrl.endsWith('.ico')
                ? 'image/x-icon'
                : 'text/plain';
              res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename="${path.basename(cleanUrl)}"`,
                'Cache-Control': 'no-cache',
              });
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), staticInstallerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
