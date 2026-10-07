import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from root directory as well as frontend directory
  const envDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, envDir, '');
  const localEnv = loadEnv(mode, __dirname, '');
  const mergedEnv = { ...env, ...localEnv };

  const pinataJwt = mergedEnv.PINATA_JWT || mergedEnv.VITE_PINATA_JWT || '';

  return {
    plugins: [
      react(),
      {
        name: 'pinata-secure-proxy',
        configureServer(server) {
          // Local Vite dev server endpoint to proxy file upload to Pinata without exposing JWT in browser
          server.middlewares.use('/api/pinata-upload', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              return res.end('Method Not Allowed');
            }

            const currentJwt = pinataJwt || process.env.PINATA_JWT || process.env.VITE_PINATA_JWT;
            if (!currentJwt || currentJwt.includes('PASTE_YOUR_NEW')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  error: 'PINATA_JWT is not configured or still set to placeholder in .env file.'
                })
              );
            }

            const proxyReq = https.request(
              'https://api.pinata.cloud/pinning/pinFileToIPFS',
              {
                method: 'POST',
                headers: {
                  ...req.headers,
                  host: 'api.pinata.cloud',
                  Authorization: `Bearer ${currentJwt.trim()}`
                }
              },
              (proxyRes) => {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
              }
            );

            proxyReq.on('error', (err) => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            });

            req.pipe(proxyReq);
          });
        }
      }
    ],
    server: {
      port: 5173,
      host: true
    }
  };
});
