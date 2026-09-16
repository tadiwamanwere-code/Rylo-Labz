const { list } = require('@vercel/blob');

// Renders each article as full HTML on the server, so Google sees the real
// title, description, canonical link and text on the first visit. The old
// page filled these in with JavaScript, which left every article pointing
// its canonical tag at /article, so Google treated them as one page.

const BASE_URL = 'https://rylolabz.com';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function friendlyDate(iso) {
  const d = new Date(iso || '');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// Article content is plain text. Blank lines split paragraphs. A short line
// with no closing punctuation reads as a subheading, so it becomes an <h2>.
function renderContent(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const isHeading = !block.includes('\n') && block.length <= 80 && !/[.!?:,;]$/.test(block);
      if (isHeading) return `<h2>${esc(block)}</h2>`;
      return `<p>${esc(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
}

async function findArticle(slug) {
  const response = await list({ prefix: `articles/${slug}.json`, limit: 1 });
  const blob = (response.blobs || []).find((b) => b.pathname === `articles/${slug}.json`);
  if (!blob) return null;
  const result = await fetch(blob.url, { cache: 'no-store' });
  if (!result.ok) return null;
  const data = await result.json();
  return data && data.title ? data : null;
}

function page({ title, description, canonical, robots, bodyHtml, jsonLd, status }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="${robots}" />
  ${canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : ''}
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Rylo Labz" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  ${canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : ''}
  <meta property="og:image" content="${BASE_URL}/images/Portfolio/rylo-logo.png" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" href="/images/Portfolio/rylo-favicon.png" type="image/png" />
  <link rel="apple-touch-icon" href="/images/Portfolio/rylo-favicon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css?v=65" />
  <link rel="stylesheet" href="/ascend.css?v=3" />
  ${jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`).join('\n  ')}
  <style>
    body { background: var(--bg); }
    .article-wrap { max-width: 720px; margin: 0 auto; padding: clamp(48px, 8vw, 96px) var(--s-6) var(--s-20); }
    .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-small); color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 2px; margin-bottom: var(--s-8); width: fit-content; }
    .back-link:hover { color: var(--text); border-color: var(--text); }
    .article-meta { color: var(--text-muted); font-size: var(--fs-micro); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: var(--s-3); }
    .article-wrap h1 { font-family: var(--font-serif); font-size: clamp(34px, 5vw, 56px); line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 var(--s-4); }
    .article-summary { color: var(--text-muted); font-size: var(--fs-body-lg); line-height: 1.6; margin: 0 0 var(--s-8); }
    .article-body { line-height: 1.8; font-size: var(--fs-body-lg); color: var(--text-2); }
    .article-body p { margin: 0 0 1.2em; }
    .article-body h2 { font-size: clamp(22px, 2.6vw, 28px); line-height: 1.2; color: var(--text); margin: 1.8em 0 0.6em; }
    hr.article-sep { border: 0; height: 1px; background: var(--border); margin: var(--s-8) 0; }
  </style>
</head>
<body>
  <header class="nav nav--scrolled">
    <div class="nav-inner">
      <a href="/" class="brand">
        <img src="/images/Portfolio/rylo-favicon.png" alt="Rylo Labz logo" class="brand-mark" />
        <span>Rylo Labz</span>
      </a>
      <nav class="nav-links" aria-label="Primary">
        <a href="/#services">Services</a>
        <a href="/portfolio">Client Work</a>
        <a href="/reviews">Reviews</a>
        <a href="/#why">Why Rylo</a>
        <a href="/#team">Executives</a>
        <a href="/#resources">Updates</a>
      </nav>
      <a href="/#contact" class="btn btn--ink btn--sm nav-cta" data-uop-event="clicked_start_project_nav_article">
        <span>Start a project</span>
      </a>
    </div>
  </header>

  <main class="article-wrap">
    <a href="/#resources" class="back-link">← Back to updates</a>
    ${bodyHtml}
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand"><span>Rylo Labz</span></div>
      <nav class="footer-links" aria-label="Footer">
        <a href="/#services">Services</a>
        <a href="/portfolio">Client Work</a>
        <a href="/reviews">Reviews</a>
        <a href="/#team">Founders</a>
        <a href="/#contact">Contact</a>
      </nav>
      <span class="footer-copy">© 2026 Rylo Labz · Bulawayo, Zimbabwe</span>
    </div>
  </footer>
</body>
</html>`;
}

function notFound(res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(404).send(page({
    title: 'Article not found | Rylo Labz',
    description: 'This article does not exist or has been moved.',
    canonical: '',
    robots: 'noindex, follow',
    bodyHtml: '<article><h1>Article not found</h1><p class="article-summary">It may have been moved. Head back to the latest updates.</p></article>',
    jsonLd: []
  }));
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || '').trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return notFound(res);

  let article;
  try {
    article = await findArticle(slug);
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(503).send('Temporarily unavailable. Please try again shortly.');
  }
  if (!article) return notFound(res);

  const pageUrl = `${BASE_URL}/article?slug=${encodeURIComponent(slug)}`;
  const author = article.author || 'Rylo Labz';
  const date = friendlyDate(article.publishedAt);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.summary || '',
      image: `${BASE_URL}/images/Portfolio/rylo-logo.png`,
      author: { '@type': 'Organization', name: author, url: `${BASE_URL}/` },
      publisher: {
        '@type': 'Organization',
        name: 'Rylo Labz',
        url: `${BASE_URL}/`,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/Portfolio/rylo-logo.png` }
      },
      datePublished: article.publishedAt || undefined,
      dateModified: article.publishedAt || undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
      url: pageUrl
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: article.title, item: pageUrl }
      ]
    }
  ];

  const bodyHtml = `<article>
      <div class="article-meta">${esc([date, author].filter(Boolean).join(' · '))}</div>
      <h1>${esc(article.title)}</h1>
      <p class="article-summary">${esc(article.summary || '')}</p>
      <hr class="article-sep" />
      <div class="article-body">
${renderContent(article.content)}
      </div>
    </article>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
  return res.status(200).send(page({
    title: `${article.title} | Rylo Labz`,
    description: article.summary || 'Insights on custom software, AI automation, and websites from the Rylo Labz team.',
    canonical: pageUrl,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1',
    bodyHtml,
    jsonLd
  }));
};
