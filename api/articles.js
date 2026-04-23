const { list, put } = require('@vercel/blob');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function readArticles() {
  let response;
  try {
    response = await list({ prefix: 'articles/', limit: 200 });
  } catch {
    return [];
  }
  const blobs = response.blobs || [];
  const items = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const result = await fetch(blob.url, { cache: 'no-store' });
        if (!result.ok) return null;
        const data = await result.json();
        return {
          slug: data.slug,
          title: data.title,
          summary: data.summary,
          content: data.content,
          author: data.author,
          publishedAt: data.publishedAt
        };
      } catch {
        return null;
      }
    })
  );

  return items
    .filter(Boolean)
    .filter((item) => item.slug && item.title)
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
}

function unauthorized(res) {
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const articles = await readArticles();
    const { slug } = req.query || {};
    if (slug) {
      const article = articles.find((item) => item.slug === slug);
      if (!article) return res.status(404).json({ error: 'Article not found' });
      return res.status(200).json({ article });
    }
    return res.status(200).json({ articles });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const adminToken = process.env.RYLO_ADMIN_TOKEN;
  if (!adminToken || headerToken !== adminToken) {
    return unauthorized(res);
  }

  const body = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body;
  const title = String(body?.title || '').trim();
  const summary = String(body?.summary || '').trim();
  const content = String(body?.content || '').trim();
  const author = String(body?.author || 'Rylo Labz').trim();
  const publishedAt = body?.publishedAt ? new Date(body.publishedAt).toISOString() : new Date().toISOString();

  if (!title || !summary || !content) {
    return res.status(400).json({ error: 'title, summary and content are required' });
  }

  const slug = slugify(body?.slug || title);
  if (!slug) return res.status(400).json({ error: 'Invalid slug or title' });

  const article = { slug, title, summary, content, author, publishedAt };
  const pathname = `articles/${slug}.json`;

  try {
    await put(pathname, JSON.stringify(article, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      addRandomSuffix: false
    });
  } catch {
    return res.status(500).json({
      error: 'Storage is not configured. Set BLOB_READ_WRITE_TOKEN in Vercel project environment variables.'
    });
  }

  return res.status(200).json({ ok: true, article });
};
