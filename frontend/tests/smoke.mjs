import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const required = [
  'index.html', 'vite.config.js', 'public/manifest.json', 'public/robots.txt',
  'public/sitemap.xml', 'public/sw.js', 'src/App.jsx', 'src/index.css'
];
for (const file of required) {
  if (!existsSync(resolve(root, file))) throw new Error(`Missing required file: ${file}`);
}
const manifest = JSON.parse(readFileSync(resolve(root, 'public/manifest.json'), 'utf8'));
if (!manifest.name || !manifest.start_url || !Array.isArray(manifest.icons) || manifest.icons.length < 2) {
  throw new Error('PWA manifest is incomplete');
}
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
for (const token of ['description', 'og:title', 'twitter:card', '/manifest.json']) {
  if (!html.includes(token)) throw new Error(`Missing SEO/PWA marker: ${token}`);
}
console.log(`RA Social frontend smoke checks passed (${required.length} required files checked).`);
