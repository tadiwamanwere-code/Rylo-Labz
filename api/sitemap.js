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
  const staticUrls = [
    `${baseUrl}/`,
    `${baseUrl}/admin`
  ];

  let articleUrls = [];
  try {
    const response = await list({ prefix: 'articles/', limit: 200 });
    articleUrls = (response.blobs || []).map((blob) => {
      const slug = blob.pathname.replace(/^articles\//, '').replace(/\.json$/, '');
      return `${baseUrl}/article?slug=${encodeURIComponent(slug)}`;
    });
  } catch {
    articleUrls = [];
  }

  const urls = [...staticUrls, ...articleUrls];
  const now = new Date().toISOString().slice(0, 10);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc><lastmod>${now}</lastmod></url>`),
    '</urlset>'
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
  return res.status(200).send(body);
};
