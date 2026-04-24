# Designer Fundamentals — a primer grounded in what we saw on HubSpot

This is the "how to be a better designer" doc you asked for. Every principle below is tied to something we observed on HubSpot's live site, so it's not abstract — it's "here's what they actually did, and here's why it worked."

Read this once end to end. Then keep it open when you design.

---

## 0. The mindset shift

Most people think **design = decoration**. Pros think **design = decisions about hierarchy, rhythm, and restraint**. HubSpot's homepage uses roughly 3 colors, 2 fonts, and 1 accent per section. That's not minimalism for its own sake — it's because every additional variable you introduce competes for the viewer's attention, and attention is the only currency that matters on a landing page.

**The question you ask at every step:** *"What is this section's single job?"* If you can't answer in one sentence, the design has no chance.

---

## 1. Hierarchy — the thing you have to master first

Hierarchy is *the order the eye travels in*. You control it with:

| Lever | Strong → Weak |
|---|---|
| Size | Big → small |
| Weight | Bold → regular → light |
| Color | Saturated → desaturated → muted |
| Contrast | High-contrast on bg → low-contrast |
| Position | Top-left (in LTR) → bottom-right |
| Whitespace | Isolated → clustered |

**HubSpot example:** the hero headline is ~90px serif black on a dimmed photo — maximum size + maximum weight + maximum contrast. The subhead is 18px sans regular. The nav logo is 24px sans regular. The microcopy at the bottom is 12px gray. Five clearly different levels. Your eye *knows* where to start.

**Your homework:** open your current [index.html](../index.html) in a browser, squint until everything blurs, and ask: *how many clearly distinguishable text sizes are there?* If the answer is >6 or <3, you have a hierarchy problem.

**Rule of thumb:** a landing page should have **4 levels** of text hierarchy:
1. Display (hero h1) — 64–96px
2. Section heading (h2) — 36–48px
3. Body / paragraph — 16–18px
4. Microcopy (labels, legal) — 12–14px

That's it. No 7th "kind of big but not that big" size.

---

## 2. The type scale

Amateur designers pick font sizes like "uh, 20 looks good, 23 looks good." Pros use a **scale** — a small set of sizes chosen in advance, and every piece of text on the site uses one of those sizes.

**How to build one:**
1. Pick a body size (16px is the web default — don't fight it).
2. Pick a ratio: 1.125 (subtle), 1.2 (common), 1.25 (dramatic), 1.333 (very dramatic).
3. Multiply down and up: `body ÷ ratio = small`, `body × ratio = large`, etc.

Example with ratio 1.25:
- 12 · 14 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96

**HubSpot's scale is hand-tuned** (not a clean ratio), but there are still clear steps — not 30 random values. You can see the tokens `--cl-font-size-h1 / h2 / h3 / display-01 / display-02 / display-03` in their CSS.

**Practical rule:** define `--fs-100, --fs-200, --fs-300, --fs-400, --fs-500, --fs-600, --fs-700, --fs-800` as CSS custom properties. Never use a size outside that set.

---

## 3. The spacing scale

Same idea, but for margin / padding / gap. This is the one most amateurs miss.

Pick a **base unit** (4px or 8px). Every spacing value must be a multiple of that unit.

Example 4px base: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160`

Why it works: spaces feel *related* even at a subconscious level when they share a rhythm. A section padded at 96px next to a card gap of 24px (both divisible by 8) feels coherent. A section at 96 next to a card at 25 feels *off*, and you can't explain why.

**HubSpot uses a 4-base with hand-tuned larger steps** (52, 68). That's advanced. For you, stick to clean multiples of 8 for now.

**Section padding convention** (worth memorizing):
- Desktop: 96–120px top/bottom
- Tablet: 64–80px
- Mobile: 48–64px

If your sections feel cramped, they probably are. Go look at HubSpot — their sections *breathe*.

---

## 4. Color — fewer is better

The single most common failure of amateur design: too many colors.

**The palette you need:**
1. **1 neutral system** — 5–6 grays from near-black to near-white
2. **1 brand accent** — your "hero" color, used sparingly (CTAs, highlights, icons)
3. **1 semantic set** — green for success, red for error, yellow for warning (only if your product needs them)

That's it. 7–10 colors total. Not 30.

**HubSpot does something more advanced** — they have *product-line* accents (orange for Marketing, magenta for Sales, lime for Service, blue for Content). Each accent gets **its own section**. They never stack them. This is how multi-product companies stay coherent.

**For RyloLabz** (one product): pick ONE accent. Every CTA and highlight uses it. If you use it a second color, you'd better have a specific semantic reason.

**The 60-30-10 rule** (from interior design, applies beautifully to UI):
- 60% neutral background
- 30% secondary surface/text
- 10% accent

When HubSpot's homepage loads, >60% of pixels are cream/warm neutral, ~30% is the dark text + photograph mid-tones, and only ~10% is the orange accent. Open one of the screenshots in this folder and count.

---

## 5. Contrast — legal and visual

**Legal**: WCAG AA contrast for body text is 4.5:1 (large text 3:1). Use a contrast checker. Don't ship gray-on-gray just because it looks clean.

**Visual**: the *bigger* the contrast, the *more* attention the element gets. Reserve maximum contrast (pure black on pure white) for the thing you want read first. Dial contrast down for secondary elements.

**HubSpot trick**: body text is `#141414` not `#000`. Dead black feels harsh on warm backgrounds. Off-black feels intentional.

---

## 6. Typography — the 5 things that separate pros from amateurs

1. **Pair one serif with one sans.** Never more than two typefaces. HubSpot pairs HubSpot Serif (display) with HubSpot Sans (body). You already pair Instrument Serif with Inter — that's correct.
2. **Line-height 1.4–1.7 for body, 1.0–1.2 for display.** Tighter on headlines, looser on paragraphs.
3. **Line length: 60–75 characters.** Shorter feels jumpy. Longer is tiring. Set `max-width: 65ch` on paragraphs.
4. **Letter-spacing: tighten display, loosen small caps.** Headlines in serif often look better at `letter-spacing: -0.02em`. Eyebrow labels in small caps want `letter-spacing: 0.12em`.
5. **Use italics for emphasis, bold for hierarchy.** Don't italicize every adjective. Italics mean "read this with a different tone."

---

## 7. Whitespace — the invisible component

Whitespace isn't empty space. It's what tells the eye *this element is its own thing*. If you isolate something with 60px of whitespace, the brain flags it as important. If you crowd it in at 8px, the brain groups it with whatever's next to it.

**Rule**: the more important an element, the more whitespace around it. A hero H1 should have 120+px of whitespace above it. A legal footnote can be 8px from the thing above.

HubSpot's hero headline has ~180px from the top of the viewport. Their case-study micro-credits at the bottom have 8px between line 1 and line 2. Whitespace tells you the hierarchy *before* you read a single word.

---

## 8. Alignment — everything lines up or it's wrong

Every element on a page should line up to a grid with something else. If it doesn't, the eye notices even if the conscious mind doesn't.

**Tools**:
- CSS Grid — best for full page layouts
- Flexbox — best for components
- `max-width` on a container — defines the page's *outer* rails
- Consistent gap on every grid/flex container

**The discipline**: before you ship, look at the page with a ruler. Do all the left edges of your cards line up? Do your h2s line up with your paragraphs? If anything is 2px off from the grid, it's noise, not design.

---

## 9. Rhythm — how to make a long page feel shorter

A landing page is a scroll experience. Your job is to keep the reader going.

**Alternate section textures** — this is HubSpot's biggest trick:
1. Photo hero (heavy visual)
2. Card grid on cream (light, structured)
3. Full-bleed quote on dark (dramatic)
4. Feature block with illustration (light, casual)
5. Pricing table (structured, focus)
6. Testimonial carousel (human)
7. Final CTA on photo (heavy, emotional)

Never two card grids in a row. Never two photo heroes in a row. Variety keeps the eye engaged.

**RyloLabz homework**: look at your current [index.html](../index.html). You have hero → mission → luxtutor cards → evidence split → traction cards → insights cards → company → contact. Two card-grid sections in a row (`feature-grid` then `pipeline-grid`). That's a rhythm problem. Break it up with a photo section between them.

---

## 10. Motion — the 90/10 rule

90% of your motion should be **functional** (a menu opens, a card hovers). 10% can be **delightful** (a rotating headline word, an autoplay carousel).

Rules:
- Nothing bounces or springs unless it's a clear "toy" element (e.g., mascot).
- Duration: micro-interactions 150ms, page transitions 300–500ms, ambient motion (carousels) 20–40s per cycle.
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for loops.
- Respect `prefers-reduced-motion`. Always.

**HubSpot is disciplined here** — cards lift 2px on hover, the hero word rotates every 3s, the carousel drifts. Nothing else moves unless clicked. That's what "polished" looks like.

---

## 11. Components — how pros stop reinventing

Every piece of UI should be a **component with variants**. HubSpot's `cl-button` has `-primary / -secondary / -tertiary / -tertiary-outline` variants and `-small / -medium / -large` sizes and `-light` for dark backgrounds. That's 4 × 3 × 2 = 24 button styles from ONE component.

**The pattern**:
1. Identify the atoms (button, input, tag, card).
2. Write one component per atom with named variants.
3. Use modifier classes (`.btn.-primary.-lg`) or data-attributes (`<button data-variant="primary" data-size="lg">`).
4. Never write a one-off component. If you need a new button, you need a new *variant*.

---

## 12. The critique checklist (use before shipping)

Before you ship any page, walk through this list:

- [ ] **Squint test**: when I blur my eyes, is the primary CTA the first thing I see?
- [ ] **Hierarchy**: 4 clear text levels, not 6+, not 2-.
- [ ] **Spacing**: every margin/padding is a multiple of my base unit.
- [ ] **Colors**: counted on the page — 3 neutrals + 1 accent, total.
- [ ] **Alignment**: every left edge lines up with something.
- [ ] **Line length**: no paragraph is wider than 75ch.
- [ ] **Contrast**: body text passes AA against its background (check with devtools).
- [ ] **Mobile**: does the layout still feel like 60/30/10, or is it squished?
- [ ] **Motion**: everything moving has a reason.
- [ ] **Photography**: if I used stock photos, do they share a grading/tone? Mixed grading = amateur tell.
- [ ] **Consistency**: does every button look like it came from the same design system?

---

## 13. How to get better, fast

1. **Copy masters weekly**. Every Sunday, rebuild a section of a site you admire (HubSpot, Linear, Stripe, Vercel, Apple). Not as a design — as **code**. You'll internalize their token systems.
2. **Keep a swipe file**. A folder with screenshots of sections that made you stop scrolling. Note *why* each one works.
3. **Learn to read CSS**. Open devtools on any good site and inspect their `padding`, `font-size`, `border-radius`. Observe their scales.
4. **Limit your palette**. Pick your 10 tokens before you start designing. Don't add an 11th mid-project.
5. **Ship, look, revise**. No design looks right in Figma. Build it, look at it in the browser, sleep on it, come back and fix what's off.

---

## 14. The one book + three links

- **Book**: *Refactoring UI* (Steve Schoger & Adam Wathan). Short, actionable, cheap. The fastest upgrade for a self-taught designer.
- **Link**: [type-scale.com](https://type-scale.com) — generate a type scale in 30 seconds.
- **Link**: [colorsinspo.com](https://colorsinspo.com) — curated palettes with usage examples.
- **Link**: [refactoringui.com/previews/building-your-color-palette](https://www.refactoringui.com/previews/building-your-color-palette) — how pros build palettes.

---

## 15. Your immediate next move

You're about to see me redesign [index.html](../index.html) and [styles.css](../styles.css) using everything above. When I'm done, open the diff and for each change ask: *"which principle from this doc is that?"* If you can name the principle, you've internalized it. If you can't, ask me — that's the whole point.
