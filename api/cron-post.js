const Anthropic = require('@anthropic-ai/sdk');
const { zodOutputFormat } = require('@anthropic-ai/sdk/helpers/zod');
const { z } = require('zod');
const { list, put } = require('@vercel/blob');

// Writes and publishes one blog post. Vercel Cron calls this on the schedule
// in vercel.json (Monday and Thursday mornings). Each run picks the next topic
// area, shows Claude every title already published so it never repeats, and
// saves the post where /api/articles and /article already read from.
//
// Needs these Vercel environment variables:
//   ANTHROPIC_API_KEY  - Claude API key
//   CRON_SECRET        - Vercel sends it on cron calls; stops strangers triggering posts
//   BLOB_READ_WRITE_TOKEN - already set, used for article storage
//
// Manual run: GET /api/cron-post with header "Authorization: Bearer <CRON_SECRET>".
// Add ?dry=1 to see the post without publishing it.

const PostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  content: z.string()
});

// Rotated in order, one per run, so coverage stays spread across the business.
const TOPIC_AREAS = [
  'WhatsApp AI for customer service and sales in Zimbabwe',
  'Custom software versus off-the-shelf tools for Zimbabwean businesses',
  'Websites that bring in enquiries for small businesses in Zimbabwe',
  'AI automation of everyday admin: quotes, invoices, follow-ups, reports',
  'Choosing and working with a software developer in Zimbabwe',
  'Industry guide: construction, joinery and trades going digital',
  'Industry guide: accountants, consultants and professional services',
  'Industry guide: guest houses, lodges, restaurants and catering',
  'Industry guide: pharmacies, clinics and dental practices',
  'Getting found on Google: local SEO for businesses in Harare and Bulawayo',
  'Business management systems: stock, staff, cash flow visibility',
  'Case-study style lessons from building real client systems'
];

const SYSTEM_PROMPT = `You write blog posts for Rylo Labz, a software and AI studio in Zimbabwe. The goal is posts that genuinely help Zimbabwean business owners and rank on Google for the questions they search.

Facts about Rylo Labz you may use:
- Services: custom software, AI automation, WhatsApp AI systems, and conversion-focused websites.
- Based in Zimbabwe (Bulawayo and Harare), working with businesses across Zimbabwe and Africa remotely.
- Fixed-price projects, a working demo in about 2 weeks for most projects, and the client owns the code outright.
- More than 20 client websites live in production. Named clients include Safeway Furniture (Harare joinery, live kitchen quote estimator), Hove Construction, Arygyle Chartered Accountants, BJ Accounting, Kwekwe Rose Gardens (guest house) and Gordon's Bnb.
- Contact: WhatsApp +263 71 507 9192, or the contact form at rylolabz.com.

Writing rules:
- Pick one specific question a real business owner in Zimbabwe would type into Google, and answer it completely. Practical, local, concrete.
- 900 to 1400 words. Plain, everyday English. Short paragraphs.
- Never invent statistics, prices, survey results, client names, quotes or outcomes. If a number is not in the facts above, speak generally instead.
- Do not use em dashes.
- The content field is plain text only: paragraphs separated by one blank line. Subheadings go on their own line, are short, and have no ending punctuation. No markdown symbols, bullets, asterisks, hashes or links.
- Mention Rylo Labz naturally near the end with one clear next step. Not salesy, and not in every paragraph.
- title: under 65 characters, contains the main search phrase.
- summary: 140 to 160 characters, used as the Google description.
- slug: lowercase words joined by hyphens, based on the main search phrase.`;

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function removeEmDashes(text) {
  return String(text).replace(/\s*—\s*/g, ', ');
}

async function readPublished() {
  const response = await list({ prefix: 'articles/', limit: 1000 });
  const posts = await Promise.all(
    (response.blobs || []).map(async (blob) => {
      const slug = blob.pathname.replace(/^articles\//, '').replace(/\.json$/, '');
      try {
        const result = await fetch(blob.url, { cache: 'no-store' });
        const data = result.ok ? await result.json() : null;
        return { slug, title: (data && data.title) || slug };
      } catch {
        return { slug, title: slug };
      }
    })
  );
  return posts;
}

async function writePost(topicArea, published) {
  const client = new Anthropic();
  const titles = published.map((p) => `- ${p.title}`).join('\n') || '- (none yet)';

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: zodOutputFormat(PostSchema)
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Topic area for this post: ${topicArea}\n\nAlready published. Do not repeat these or overlap closely with them:\n${titles}\n\nWrite the post.`
      }
    ]
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to write this post');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('Post was cut off before it finished');
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No post text in the response');

  const parsed = PostSchema.safeParse(JSON.parse(textBlock.text));
  if (!parsed.success) throw new Error('Post did not match the expected shape');
  return parsed.data;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel' });
  }

  const dryRun = String((req.query && req.query.dry) || '') === '1';

  try {
    const published = await readPublished();
    const topicArea = TOPIC_AREAS[published.length % TOPIC_AREAS.length];
    const draft = await writePost(topicArea, published);

    const taken = new Set(published.map((p) => p.slug));
    const baseSlug = slugify(draft.slug || draft.title) || `post-${Date.now()}`;
    let slug = baseSlug;
    for (let n = 2; taken.has(slug); n += 1) slug = `${baseSlug}-${n}`;

    const article = {
      slug,
      title: removeEmDashes(draft.title).trim(),
      summary: removeEmDashes(draft.summary).trim(),
      content: removeEmDashes(draft.content).trim(),
      author: 'Rylo Labz',
      publishedAt: new Date().toISOString()
    };

    if (dryRun) {
      return res.status(200).json({ ok: true, dryRun: true, topicArea, article });
    }

    await put(`articles/${slug}.json`, JSON.stringify(article, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: false,
      addRandomSuffix: false
    });

    return res.status(200).json({
      ok: true,
      topicArea,
      slug,
      url: `https://rylolabz.com/article?slug=${encodeURIComponent(slug)}`
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({ error: `Claude API error ${error.status}`, detail: error.message });
    }
    return res.status(500).json({ error: error.message || 'Post generation failed' });
  }
};
