# HubSpot.com — Design Teardown (2026-04-24)

Captured: 4 live pages
- `/` (homepage)
- `/products/marketing`
- `/products/cms`
- `/pricing/marketing`

Artifacts: `~/.claude/skills/web-scrape-design/output/hubspot-2026-04-24/` (rendered HTML, full-page PNGs, every CSS file, computed styles)

Reference screenshots: [hubspot-home-viewport.png](hubspot-home-viewport.png), [hubspot-marketing-viewport.png](hubspot-marketing-viewport.png), [hubspot-pricing-viewport.png](hubspot-pricing-viewport.png)

---

## 1. The "big idea" in one paragraph

HubSpot in 2026 is **warm editorial, not tech saas**. The homepage leads with a cinematic photograph of humans (go-to-market teams at a desk) wrapped in cream/brown tones, a massive *serif* display headline with a rotating word, and a single orange primary CTA. There is no blue gradient, no floating 3D dashboard, no robot mascot. The surface is closer to a business magazine than to 2020-era SaaS. The Clarity design system (`cl-*` classes) enforces consistency across 200+ pages.

**What this means for RyloLabz:** you already lean editorial. HubSpot's structural DNA — serif display type, warm palette, photography-forward, large whitespace, single-punch accent color — is very compatible with your "built in Bulawayo, African education" positioning. Don't copy HubSpot's orange; adopt their *restraint* and apply it to your own palette.

---

## 2. Stack & framework detection

Wappalyzer returned empty (HubSpot heavily obfuscates via their CDN), but structural evidence is clear:

| Layer | Evidence | Implication |
|---|---|---|
| **CMS** | Class names like `hs-beacon`, `hs_cos_wrapper`, `wf-*`, meta gen tag | HubSpot's own CMS (obviously — dogfooding). |
| **Design system** | `cl-button`, `cl-card`, `cl-carousel`, `cl-h2` | Proprietary "Clarity" component library. |
| **Fonts** | `HubSpot Serif`, `HubSpot Sans` (self-hosted) + Lato fallback via Google Fonts | Custom typefaces — a premium signal. |
| **Naming** | BEM-ish with `-modifier` prefix (`cl-button -primary -large`) | Lets modifiers stack orthogonally (`-primary -large -light`). |
| **Responsive** | Custom breakpoints at 450/544/568/575/694/800/900/966/1080/1152 | Hand-tuned per component, NOT a utility framework like Tailwind. |

**They do NOT use:** Tailwind, Bootstrap, Material, Chakra, or any off-the-shelf CSS framework. This is bespoke.

---

## 3. Design tokens — the actual numbers

### 3.1 Color system

**Declared in CSS (brand-level):**

| Token | Hex | Role |
|---|---|---|
| Primary orange | `#ff4800` | THE HubSpot signature. Appears 52 times on home. Used for primary CTAs and the wordmark. |
| Orange (bright) | `#ff5c35` | Hover / highlight variant of primary. |
| Orange (deep) | `#c93700` | Pressed state. |
| Pink / magenta | `#d20688`, `#a5016a`, `#800051` | Sales Hub identity. |
| Electric lime | `#bcff2b` | Service/Breeze AI accent. |
| Electric blue | `#1d0cff` | Content Hub identity. |
| Red warning | `#d9002b` | Error / alert only. |
| Near-black text | `#141414`, `#1f1f1f` | Body copy and headlines on light bg. |
| Muted gray | `#8a8a8a`, `#666` | Secondary text, dividers. |
| Light gray | `#f5f5f5`, `#e6e6e6` | Page surfaces. |
| Cool blue-gray | `#eaf0f6`, `#f5f8fa`, `#2e475d` | Legacy HubSpot content surfaces (older templates). |
| Cream | `#f8f5ee` | Hero/section warm backgrounds. |

**Key pattern — product identity colors:** Each product "Hub" gets its own accent (Marketing = orange, Sales = magenta, Service = lime, Content = blue). That's how you tell a **multi-product company** apart visually without fragmenting the brand.

**Perceived palette (from screenshot pixels, not CSS):**

| Page | Dominant | Top 4 palette colors |
|---|---|---|
| Home | `#372c26` (chocolate) | cream `#f0d8cb`, near-black `#231d1a`, taupe `#836d5f`, brown `#604939` |
| Marketing | `#271a26` | cream `#f8f1eb`, dark `#271823`, orange `#e34a17`, cyan `#41a3cc` |
| CMS | `#20252a` | cream `#f8f4ee`, near-black `#1f2123`, orange `#dd4d16`, gold `#dd9944` |
| Pricing | `#112428` | deep blue-green `#112428`, off-white `#edeff0`, orange `#d76021`, cyan `#2477cd` |

**Takeaway:** the declared palette is one thing; what you *see* is dominated by hero photography in warm cream/brown + one accent. **This is the single most important visual insight.**

### 3.2 Type scale

Font families (in order of usage):
1. `HubSpot Serif` — display headlines only (h1, giant heroes). A modern high-contrast serif.
2. `HubSpot Sans` — body, h2–h6, UI.
3. `Lato` — Google-font fallback.

Via CSS custom properties they expose a structured scale:

```
--cl-font-size-display-01   (largest hero)
--cl-font-size-display-02
--cl-font-size-display-03
--cl-font-size-h1
--cl-font-size-h1-small
--cl-font-size-h2
--cl-font-size-h3
--cl-font-size-h4
--cl-font-size-h5
--cl-font-size-h6
--cl-font-size-blockquote
--cl-text-font-size          (body)
--cl-font-size-small
--cl-font-size-p-small
--cl-font-size-microheading  (eyebrow labels)
--cl-font-size-microcopy     (legal / fine print)
--cl-button-font-size
```

Body text observed around 16px, h1 display around 72–96px, microcopy around 12px. The scale **does not follow a simple ratio** (like 1.25× modular) — it's hand-tuned. Larger steps at the display end, finer steps at the body end.

### 3.3 Spacing scale

After deduplication: `0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 52, 56, 64, 68, 80px` — a 4/8-base grid with a few custom steps (52, 68) for typographic rhythm. Section padding commonly `80–96px` on desktop, `48–64px` on tablet, `32–48px` on mobile.

### 3.4 Radii

`3px, 4px, 8px, 16px, 20px, 48px, 50%`

Applied:
- **3–4px** → chips, tags, form inputs
- **8px** → cards
- **16–20px** → hero panels, large surfaces
- **48px / 50%** → pill buttons (the default button shape is a pill, NOT a rounded rectangle)

### 3.5 Shadows

Only a handful of shadow tokens exist — HubSpot is very restrained.

```
none                                                (default)
0 0 0 1px <border-color>                            (card border, not shadow)
0 2px 4px rgba(33,51,67,.12)                        (nav, on scroll)
0 8px 28px rgba(0,0,0,.28)                          (modal / lifted overlay)
```

Notice: the "card shadow" is actually a **1px border**, not a shadow. Elevation is earned, not sprinkled.

### 3.6 Breakpoints

Custom per-component: `450, 544, 568, 575, 694, 800, 900, 966, 1080, 1152px`. No consistent media-query boundary — each component optimizes its own layout. (Advanced, expensive, but gives fine-grained fluid behavior.)

---

## 4. Component inventory

From class-name analysis + rendered HTML:

### 4.1 Navigation (`cl-nav`, `homepage-hp-nav`)
- Sticky, white background with `0 2px 4px` shadow
- Logo left → product mega-menu center → `Contact Sales` + `Sign up free` right
- Utility bar above: tiny links for "Developers / Partners / About"
- **Size variants** via modifier: `-small -light` for nav, `-medium` for mid, `-large` for hero

### 4.2 Hero (`wf-page-header`)
- Full-bleed photograph background (real people, natural light, warm grade)
- Dark overlay gradient for text legibility
- **Eyebrow** line: small caps sans, e.g., "HUBSPOT AGENTIC CUSTOMER PLATFORM"
- **H1 display**: massive serif, with ROTATING final word ("Where go-to-market teams go to retain|grow|scale|win")
- **Subhead**: one-sentence sans explanation
- **Dual CTA**: orange `-primary -large` + outline `-secondary -large`
- **Floating AI assistant widget** bottom-right (their own HubBot)
- **Stats band** below hero on some pages (5–6 numbers inline)

### 4.3 Product platform grid (`wf-product-platform__card`)
- 3×2 grid of "Hubs" — each card is `cl-card -container-01 -border -hoverable`
- Uniform card anatomy: eyebrow tag, product name, 1-sentence pitch, small CTA
- Each card inherits the product's accent color only on the CTA/icon
- Hover: slight elevation via border color change (no shadow added)

### 4.4 Testimonial carousel (`breeze-agents-tabbed-testimonials`)
- Tabbed testimonials: click author thumbnail, the quote + stat swap
- Large stat (`cl-h2`) + description + company logo
- This is a **lot** of interactive weight for a testimonial — worth it for social proof density

### 4.5 Case study carousel (`cl-carousel -infinite -autoplay -custom-breakpoints`)
- Infinite horizontal scroll, autoplay, manual dot controls
- Each card: company logo + stat + name
- Motion is slow (~40s per full cycle) — ambient, not attention-grabbing

### 4.6 Pricing tables
- Monthly/annual toggle at top
- 3–4 tier cards side-by-side, each with:
  - Tier name in sans
  - **Price in serif display** (!) — the price is typographically treated as a headline
  - Feature bullets
  - CTA pinned to bottom
- One tier is marked "Most Popular" with a thin colored border and eyebrow tag

### 4.7 Feature blocks (`wf-flexible-section-header`)
- **Alternating left-image / right-image** rhythm every other section
- Illustrations are flat, warm-palette, hand-drawn feel
- Never a screenshot in isolation — always composited with paper/texture or an actor

### 4.8 Footer
- 5–6 columns of links, small type
- Language/region switcher
- Legal microcopy in muted gray at the very bottom
- Not flashy — purely utilitarian

---

## 5. Layout patterns & rhythm

1. **Vertical rhythm**: every section is `80–120px` vertical padding on desktop. No cramped sections.
2. **Horizontal rhythm**: max-width content container around `1200px`. Outside is breathing room.
3. **Alternating texture**: photo → card grid → photo → testimonial → illustration → pricing → photo. Never two photo sections in a row, never two card grids in a row. The page *breathes* by varying the visual weight.
4. **Single-accent rule**: each section uses **one** non-neutral color. Never orange AND magenta AND blue in the same block.
5. **Type contrast**: every hero pairs a BIG serif display with a tight sans subhead. The contrast is doing the heavy lifting.

---

## 6. Interaction / motion patterns

- **Rotating headline word**: home hero. Word swaps with a vertical flip/crossfade every 2–3s.
- **Autoplay carousels**: case studies, customer logos. Slow, ambient.
- **Hover lift on cards**: border darkens + slight `translate-y(-2px)`, no shadow change.
- **Sticky nav becomes opaque on scroll**: transparent at hero, white with shadow past hero.
- **Scroll-triggered reveal**: mild fade-in-up on cards as they enter viewport.
- **Magnetic cursor**: NOT present (you use this on RyloLabz — they don't. Your magnetic cursor is actually a *more aggressive* design choice than HubSpot).

Motion philosophy: **ambient, confident, no surprise**. Nothing bounces or springs.

---

## 7. What to borrow vs what to leave

| Borrow | Leave |
|---|---|
| Serif display + sans body split | HubSpot's exact orange (#ff4800) — too loud for ed-tech |
| Warm cream/chocolate hero backgrounds via photography | Their 5-product Hub grid (you have one product: LuxTutor) |
| Pill-shaped buttons (`border-radius: 48px`) | Proprietary fonts (use Instrument Serif + Inter — you already do) |
| 4/8 spacing grid with 80-120px section padding | Their carousel density (feels corporate) |
| Alternating section texture (photo/card/quote/photo) | The mega-menu nav (you have 6 pages, not 60) |
| Single-accent-per-section rule | Their price-as-serif-display (but actually — YES borrow this for your stats) |
| Border-first elevation (shadows are rare) | — |
| Rotating headline word | — |

---

## 8. How to prompt an AI to build in this style (for you)

Paste the table below as context any time you want a component built in HubSpot-style:

```
DESIGN DIRECTION
- Palette: warm neutrals (cream #f8f5ee, chocolate #231d1a, off-white #f5f5f5),
  single brand accent (ONE of: orange, magenta, or rose — pick per section).
- Typography: serif display (Instrument Serif) for h1 and hero stats,
  sans body (Inter) for everything else. Body 16px. H1 72-96px desktop.
- Spacing: 4/8 grid. Section padding 96px desktop / 64px tablet / 48px mobile.
  Max content width 1200px.
- Radii: 3px chips, 8px cards, 48px buttons (pill), 20px large panels.
- Shadows: avoid. Use 1px borders for elevation. Exception: sticky nav gets
  `0 2px 4px rgba(0,0,0,.08)` once it's past the hero.
- Motion: ambient only. No bounces. Cards lift 2px on hover via transform,
  border darkens, no shadow change.
- Photography: always real humans in natural light, warm-graded.
  Never a product screenshot in isolation — always composited.
- Rule of one accent per section. Never stack brand colors.
```

Save that block; reuse it every single time.

---

## 9. Open questions / next investigations

- Didn't capture `/our-story` (they timed out). If you want narrative/about pages analyzed, re-run the scraper later.
- Didn't inspect their dark-mode (they appear to not offer one).
- Wappalyzer fingerprint-DB loading didn't match — can harden `detect-stack.mjs` later.
- Motion timings are eyeballed, not measured. A second pass could record video and frame-time it.
