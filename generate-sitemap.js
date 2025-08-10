#!/usr/bin/env node
/**
 * generate-sitemap.js
 *
 * Usage:
 *   node generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml
 *
 * Notes:
 * - Only .html files are included (typical public-facing pages).
 * - Excludes admin/tests/etc. and common partials (header/footer, 404/500, sitemap).
 */

const fs = require('fs');
const path = require('path');

// ---------- CLI ARGS ----------
const args = process.argv.slice(2);
const params = { base: '', root: '.', out: 'sitemap.xml' };
for (let i = 0; i < args.length; i++) {
  const k = args[i];
  if (k === '-base') params.base = (args[++i] || '').trim();
  else if (k === '-root') params.root = (args[++i] || '.').trim();
  else if (k === '-out') params.out = (args[++i] || 'sitemap.xml').trim();
}

if (!params.base) {
  console.error('Usage: node generate-sitemap.js -base https://example.com [-root .] [-out sitemap.xml]');
  process.exit(1);
}

// Normalize root to absolute path for consistent walking
params.root = path.resolve(process.cwd(), params.root);

// ---------- EXCLUSIONS ----------
const denyDirs = new Set([
  'admin', 'tests', 'cypress', 'sql', 'scripts', 'js', 'css', 'json', 'media',
  'node_modules', 'vendor', '.github'
]);

const denyFiles = new Set([
  'header.html', 'footer.html', '404.html', '500.html', 'sitemap.html', 'sitemap.xml'
]);

// ---------- COLLECT URLS ----------
/** @type {{ url: string; lastmod: string; changefreq: string; priority: string; }[]} */
const urls = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const ent of entries) {
    const nameLower = ent.name.toLowerCase();
    const abs = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      if (denyDirs.has(nameLower)) continue;
      walk(abs);
      continue;
    }

    if (!ent.isFile()) continue;

    // HTML pages only; exclude known non-index pages
    if (!nameLower.endsWith('.html')) continue;
    if (denyFiles.has(nameLower)) continue;

    // Build relative path from root
    const relPath = path.relative(params.root, abs).split(path.sep).join('/');

    // Skip files outside root (unlikely, but be safe)
    if (relPath.startsWith('..')) continue;

    // Create URL path
    let relUrl = '/' + relPath; // ensure leading slash
    // Drop index.html → folder path
    relUrl = relUrl.replace(/index\.html$/i, '');
    // Normalize: no trailing slash except site root
    if (relUrl.length > 1 && relUrl.endsWith('/')) {
      relUrl = relUrl.slice(0, -1);
    }

    const base = params.base.replace(/\/+$/, '');
    const loc = base + (relUrl || '/');

    // File info for lastmod
    const stat = fs.statSync(abs);
    const lastmod = new Date(stat.mtime).toISOString().slice(0, 10);

    // Heuristics
    const depth = relUrl.split('/').filter(Boolean).length;
    const priority = relUrl === '' ? '1.0' : (depth <= 1 ? '0.8' : '0.6');
    const changefreq = /blog|post|news/i.test(relPath) ? 'weekly' : 'monthly';

    urls.push({ url: loc, lastmod, changefreq, priority });
  }
}

walk(params.root);

// De-duplicate & sort
const seen = new Set();
const deduped = [];
for (const u of urls) {
  if (seen.has(u.url)) continue;
  seen.add(u.url);
  deduped.push(u);
}
deduped.sort((a, b) => a.url.localeCompare(b.url));

// ---------- WRITE XML ----------
function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const u of deduped) {
  xml += `  <url>\n`;
  xml += `    <loc>${escapeXml(u.url)}</loc>\n`;
  xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
  xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
  xml += `    <priority>${u.priority}</priority>\n`;
  xml += `  </url>\n`;
}
xml += `</urlset>\n`;

fs.writeFileSync(path.resolve(params.root, params.out), xml, 'utf8');
console.log(`✅ Wrote ${deduped.length} URLs → ${path.resolve(params.root, params.out)}`);
