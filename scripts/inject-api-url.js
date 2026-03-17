#!/usr/bin/env node
/**
 * inject-api-url.js
 *
 * Replaces the __FF_API_URL__ placeholder in the built HTML with the
 * actual API URL from the environment variable API_URL.
 *
 * Run automatically by Vercel/Cloudflare Pages as the build command.
 * Also run manually before deploying a static ZIP.
 *
 * Usage:
 *   API_URL=https://abc123.ngrok-free.app node scripts/inject-api-url.js
 */

const fs   = require('fs');
const path = require('path');

const API_URL = process.env.API_URL;

if (!API_URL) {
  console.warn('⚠️  API_URL not set — HTML will use the fallback URL baked into the source.');
  console.warn('   Set API_URL in your Vercel/Cloudflare dashboard or export it before running.');
  process.exit(0);
}

const files = [
  path.join(__dirname, '../frontend/public/app/index.html'),
];

let replaced = 0;
files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace the fallback URL in the API constant
  const before = content;
  content = content.replace(
    /(['"`])https:\/\/api\.forgefit\.rakshitr\.co\.in(['"`])/g,
    `$1${API_URL}$2`
  );

  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Injected API_URL=${API_URL} into ${path.basename(file)}`);
    replaced++;
  }
});

if (replaced === 0) {
  console.log('ℹ️  No replacements made — API URL may already be correct or placeholder not found.');
}
