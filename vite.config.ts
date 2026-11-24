import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handler as robloxUserHandler } from './netlify/functions/roblox-user.ts';

interface DevReq {
  method?: string;
  url?: string;
}

interface DevRes {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (chunk?: string) => void;
}

function robloxDevApiPlugin(): Plugin {
  return {
    name: 'rbxc-roblox-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/roblox-user', (rawReq, rawRes, next) => {
        const req = rawReq as DevReq;
        const res = rawRes as DevRes;
        if (req.method !== 'GET') return next();
        const parsedUrl = new URL(req.url || '/', 'http://localhost');
        const username = parsedUrl.searchParams.get('username') ?? undefined;
        const query = parsedUrl.searchParams.get('query') ?? undefined;
        void robloxUserHandler({ queryStringParameters: { username, query } }).then((result) => {
          res.statusCode = result.statusCode;
          Object.entries(result.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
          res.end(result.body);
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), robloxDevApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
});
