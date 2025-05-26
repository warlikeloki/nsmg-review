// generate-sitemap.js

const { SitemapStream } = require('sitemap');
const { createWriteStream } = require('fs');
const glob = require('glob');

(async () => {
  // 1. Find all .html and .php pages
  const files = glob.sync('**/*.{html,php}', {
    ignore: ['node_modules/**', 'generate-sitemap.js']
  });

  // 2. Build URL entries
  const links = files.map(path => ({
    url: `/${path.replace(/\\/g, '/')}`,
    changefreq: 'weekly',
    priority: 0.8
  }));

  // 3. Create a sitemap stream and pipe to file
  const sitemapStream = new SitemapStream({ hostname: 'https://neilsmith.org' });
  const writeStream   = createWriteStream('./sitemap.xml');
  sitemapStream.pipe(writeStream);

  // 4. Write each link then end the stream
  links.forEach(link => sitemapStream.write(link));
  sitemapStream.end();

  // 5. Await the write stream finishing
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  console.log('✅ sitemap.xml generated successfully');
})();
