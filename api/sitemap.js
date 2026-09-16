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
  const staticUrls = [`${baseUrl}/`, `${baseUrl}/portfolio`, `${baseUrl}/pricing`, `${baseUrl}/reviews`, `${baseUrl}/utah`].map((loc) => ({ loc }));

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
    ...urls.map(({ loc, lastmod }) => `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`),
    '</urlset>'
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  return res.status(200).send(body);
};
