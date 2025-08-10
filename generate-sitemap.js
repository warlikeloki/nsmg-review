#!/usr/bin/env node
/**
 * generate-sitemap.js
 * Simple, dependency-free sitemap generator with dev/prod modes.
 *
 * Usage (PowerShell):
 *   node .\scripts\generate-sitemap.js -base https://neilsmith.org -root . -out sitemap.xml --prod
 *   node .\scripts\generate-sitemap.js -base http://localhost:8080 -root . -out sitemap.dev.xml --dev
 *
 * Flags:
 *   -base <url>        Base site URL (e.g., https://neilsmith.org)
 *   -root <path>       Root directory to scan (default ".")
 *   -out <file>        Output sitemap file (default "sitemap.xml")
 *   --dev              Development mode (noindex pages ignored here; normal sitemap still produced)
 *   --prod             Production mode (no functional difference today; keeps intent explicit)
 *   --gzip             Also write sitemap.xml.gz
 *   --include-php      Include .php files found under the root (defaults to exclude)
 *   --strip-html-ext   Drop ".html" from URLs (e.g., /about.html -> /about)
 *   --robots <file>    (Optional) Write a robots.txt next to sitemap using mode defaults
 *   --exclude <pats>   Comma-separated globs to exclude (in addition to sensible defaults)
 *
 * Notes:
 * - Excludes admin/test/build/assets and partials by default.
 * - Heuristics assign changefreq/priority based on path.
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');

function parseArgs(argv) {
  const args = { base: '', root: '.', out: 'sitemap.xml', dev: false, prod: false, gzip: false,
    includePhp: false, stripHtmlExt: false, robots: '', excludes: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-base') args.base = argv[++i] || '';
    else if (a === '-root') args.root = argv[++i] || '.';
    else if (a === '-out') args.out = argv[++i] || 'sitemap.xml';
    else if (a === '--dev') args.dev = true;
    else if (a === '--prod') args.prod = true;
    else if (a === '--gzip') args.gzip = true;
    else if (a === '--include-php') args.includePhp = true;
    else if (a === '--strip-html-ext') args.stripHtmlExt = true;
    else if (a === '--robots') args.robots = argv[++i] || '';
    else if (a === '--exclude') {
      const next = argv[++i] || '';
      if (next) args.excludes = next.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!args.base) {
    console.error('ERROR: -base is required (e.g., -base https://neilsmith.org)');
    process.exit(2);
  }
  return args;
}

function toPosix(p) { return p.split(path.sep).join('/'); }

function isHidden(p) {
  return p.split(path.sep).some(seg => seg.startsWith('.')) || p.startsWith('~');
}

function matchesAny(p, patterns) {
  // very light glob-ish: supports prefix/suffix wildcards * and exact directories
  const s = toPosix(p);
  return patterns.some(pat => {
    const patPosix = toPosix(pat);
    if (patPosix.endsWith('/')) {
      return s.startsWith(patPosix);
    }
    if (patPosix.includes('*')) {
      const esc = patPosix.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      return new RegExp('^' + esc + '$').test(s);
    }
    return s === patPosix;
  });
}

const DEFAULT_EXCLUDES = [
  'node_modules/','cypress/','tests/','__tests__/','SQL/','.github/','.git/',
  'scripts/','js/','css/','json/','media/','assets/','dist/','build/','tmp/','temp/',
  'admin/','php/','partials/'
];

const EXCLUDE_FILES = new Set([
  'header.html','footer.html','404.html','500.html','robots.txt','sitemap.xml','sitemap.dev.xml'
]);

function fileShouldBeIndexed(relPath, includePhp, userExcludes) {
  const p = toPosix(relPath);
  if (isHidden(p)) return false;
  if (matchesAny(p, DEFAULT_EXCLUDES)) return false;
  if (matchesAny(p, userExcludes)) return false;

  const base = path.basename(p);
  if (EXCLUDE_FILES.has(base)) return false;

  const ext = path.extname(p).toLowerCase();
  if (ext === '.html') return true;
  if (ext === '.php') return includePhp; // opt-in
  return false;
}

function mapToUrl(relPath, baseUrl, stripHtmlExt) {
  let urlPath = toPosix(relPath);
  if (stripHtmlExt && urlPath.endsWith('.html')) {
    urlPath = urlPath.slice(0, -5);
  }
  // Special-case index.html -> directory URL
  if (urlPath.endsWith('/index.html')) {
    urlPath = urlPath.slice(0, -10) || '';
  }
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
  const base = baseUrl.replace(/\/+$/,''); // trim trailing slash
  return base + urlPath;
}

function heuristics(relPath) {
  const p = toPosix(relPath);
  const name = path.basename(p).toLowerCase();

  let changefreq = 'weekly';
  let priority = 0.6;

  if (p === 'index.html' || p.endsWith('/index.html')) {
    changefreq = 'daily'; priority = 1.0;
  } else if (p.startsWith('blog/') || p.includes('/blog/')) {
    changefreq = 'weekly'; priority = 0.7;
  } else if (p.startsWith('services/') || p.includes('/services')) {
    changefreq = 'monthly'; priority = 0.8;
  } else if (name.includes('privacy') || name.includes('terms')) {
    changefreq = 'yearly'; priority = 0.3;
  } else if (p.includes('/about')) {
    changefreq = 'monthly'; priority = 0.7;
  }

  return { changefreq, priority };
}

async function walk(rootDir) {
  const out = [];
  async function recur(cur) {
    const entries = await fsp.readdir(cur, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        await recur(full);
      } else if (ent.isFile()) {
        out.push(full);
      }
    }
  }
  await recur(rootDir);
  return out;
}

function xmlEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

async function writeFileEnsureDir(fp, buf) {
  await fsp.mkdir(path.dirname(fp), { recursive: true });
  await fsp.writeFile(fp, buf);
}

async function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(process.cwd(), args.root);
  const allFiles = await walk(root);

  const relFiles = allFiles.map(f => path.relative(root, f));
  const candidates = relFiles.filter(r => fileShouldBeIndexed(r, args.includePhp, args.excludes));

  const urls = [];
  for (const rel of candidates) {
    const abs = path.join(root, rel);
    const stat = await fsp.stat(abs);
    const lastmod = stat.mtime.toISOString();
    const heur = heuristics(rel);
    const loc = mapToUrl(rel, args.base, args.stripHtmlExt);
    urls.push({ loc, lastmod, changefreq: heur.changefreq, priority: heur.priority });
  }

  urls.sort((a,b) => a.loc.localeCompare(b.loc));

  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${xmlEscape(u.loc)}</loc>`);
    lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    lines.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  const xml = lines.join('\n');

  const outPath = path.resolve(process.cwd(), args.out);
  await writeFileEnsureDir(outPath, xml);

  if (args.gzip) {
    const gz = zlib.gzipSync(Buffer.from(xml, 'utf8'));
    await writeFileEnsureDir(outPath + '.gz', gz);
  }

  // optional robots.txt
  if (args.robots) {
    let robots = '';
    if (args.dev) {
      robots = [
        'User-agent: *',
        'Disallow: /',
        ''
      ].join('\n');
    } else {
      const base = args.base.replace(/\/+$/,'') + '/' + path.basename(outPath);
      robots = [
        'User-agent: *',
        'Disallow: /admin/',
        'Disallow: /php/',
        'Disallow: /scripts/',
        'Disallow: /js/',
        'Disallow: /css/',
        'Disallow: /json/',
        'Disallow: /media/private/',
        `Sitemap: ${base}`,
        ''
      ].join('\n');
    }
    const robotsPath = path.resolve(process.cwd(), args.robots);
    await writeFileEnsureDir(robotsPath, robots);
  }

  console.log(`Wrote ${outPath}${args.gzip ? ' (+ .gz)' : ''} with ${urls.length} URLs`);
  if (args.robots) console.log(`Wrote robots.txt → ${args.robots}`);
}

main().catch(err => {
  console.error('Sitemap generation failed:', err.message);
  process.exit(1);
});