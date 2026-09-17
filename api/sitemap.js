const { list } = require('@vercel/blob');

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = async (_req, res) => {
  const baseUrl = 'https://rylolabz.com';

  // Bump PAGES_CHANGED whenever one of the fixed pages is rewritten, so the
  // date Google sees is the date the page really changed.
  const PAGES_CHANGED = '2026-09-17';
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0' },
    { loc: `${baseUrl}/pricing`, priority: '0.9' },
    { loc: `${baseUrl}/utah`, priority: '0.9' },
    { loc: `${baseUrl}/portfolio`, priority: '0.8' },
    { loc: `${baseUrl}/reviews`, priority: '0.7' }
  ].map((entry) => ({ ...entry, lastmod: PAGES_CHANGED }));

  let articleUrls = [];
  try {
    const response = await list({ prefix: 'articles/', limit: 200 });
    articleUrls = (response.blobs || []).map((blob) => {
      const slug = blob.pathname.replace(/^articles\//, '').replace(/\.json$/, '');
      return { loc: `${baseUrl}/article?slug=${encodeURIComponent(slug)}`, lastmod: blob.uploadedAt ? new Date(blob.uploadedAt).toISOString().slice(0, 10) : null };
    });
  } catch {
    articleUrls = [];
  }

  const urls = [...staticUrls, ...articleUrls];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(({ loc, lastmod, priority }) => `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${priority ? `<priority>${priority}</priority>` : ""}</url>`),
    '</urlset>'
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  return res.status(200).send(body);
};
