import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const DIST_DIR = path.resolve(__dirname, 'dist');

app.get('/.well-known/discord/index.html', (_req, res) => {
  const filePath = path.join(DIST_DIR, '.well-known', 'discord', 'index.html');
  if (fs.existsSync(filePath)) {
    res.type('text/plain').sendFile(filePath);
  } else {
    res.status(404).send('Not found');
  }
});

app.use(express.static(DIST_DIR, { dotfiles: 'allow' }));

app.use((_req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build output not found. Run npm run build first.');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`RBXC V2 server listening on http://${HOST}:${PORT}`);
});
