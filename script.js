(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ========== Scroll progress bar ==========
  const progressBar = document.querySelector('.scroll-progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = scrolled + '%';
    }, { passive: true });
  }

  // ========== Cursor glow effect ==========
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && !prefersReducedMotion) {
    document.addEventListener('mousemove', (e) => {
      cursorGlow.style.setProperty('--mx', e.clientX);
      cursorGlow.style.setProperty('--my', e.clientY);
    }, { passive: true });
  }

  // ========== Counter animation for step numbers ==========
  const counters = document.querySelectorAll('.hiw-step-counter');
  const animateCounter = (element) => {
    const targetText = element.textContent;
    const targetNum = parseInt(targetText, 10);
    if (isNaN(targetNum) || prefersReducedMotion) return;

    let current = 0;
    const duration = 600;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(progress * targetNum);
      element.textContent = String(current).padStart(2, '0');

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = targetText;
      }
    };

    requestAnimationFrame(animate);
  };

  // Observe counters and animate when they come into view
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));

  // Reflective navbar — liquid glass over the dark hero, flips to white once
  // the user scrolls into the light content below it.
  const navEl = document.querySelector('.nav');
  if (navEl) {
    const heroEl = document.querySelector('.hero');
    const getThreshold = () => {
      if (heroEl) return Math.max(60, heroEl.offsetHeight - navEl.offsetHeight - 40);
      return 60;
    };
    const syncNav = () => {
      navEl.classList.toggle('nav--scrolled', window.scrollY > getThreshold());
    };
    window.addEventListener('scroll', syncNav, { passive: true });
    window.addEventListener('resize', syncNav, { passive: true });
    syncNav();
  }

  // Mobile nav menu — toggle open/close
  const navToggle = document.getElementById('nav-toggle');
  const navMobileMenu = document.getElementById('nav-mobile-menu');
  if (navToggle && navMobileMenu) {
    const iconMenu  = navToggle.querySelector('.icon-menu');
    const iconClose = navToggle.querySelector('.icon-close');

    const openMenu = () => {
      navMobileMenu.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navMobileMenu.setAttribute('aria-hidden', 'false');
      if (iconMenu)  iconMenu.style.display  = 'none';
      if (iconClose) iconClose.style.display = 'block';
    };
    const closeMenu = () => {
      navMobileMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navMobileMenu.setAttribute('aria-hidden', 'true');
      if (iconMenu)  iconMenu.style.display  = 'block';
      if (iconClose) iconClose.style.display = 'none';
    };

    navToggle.addEventListener('click', () => {
      navMobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    // Close on any nav link click
    navMobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navEl.contains(e.target)) closeMenu();
    });
  }

  // Rotating hero word
  const rotator = document.querySelector('.rotator');
  if (rotator && !prefersReducedMotion) {
    const words = (rotator.dataset.words || '').split('|').filter(Boolean);
    if (words.length > 1) {
      let idx = 0;
      const cycle = () => {
        idx = (idx + 1) % words.length;
        rotator.classList.add('swap');
        setTimeout(() => { rotator.textContent = words[idx]; }, 300);
        setTimeout(() => rotator.classList.remove('swap'), 620);
      };
      setTimeout(() => setInterval(cycle, 2600), 2000);
    }
  }

  // Articles loader — drives #articles-list from /api/articles
  function formatArticleDate(isoDate) {
    const value = isoDate ? new Date(isoDate) : null;
    if (!value || Number.isNaN(value.getTime())) return 'Update';
    return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function loadArticles() {
    const listEl = document.getElementById('articles-list');
    if (!listEl) return;

    try {
      const response = await fetch('/api/articles', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Failed to fetch articles');
      const payload = await response.json();
      const articles = Array.isArray(payload.articles) ? payload.articles : [];

      if (!articles.length) {
        listEl.innerHTML = `
          <article class="insight-card">
            <span class="insight-date">No posts yet</span>
            <h3>First article coming soon</h3>
            <p>Publish from <code>/admin</code> and it appears here automatically.</p>
          </article>
        `;
        return;
      }

      listEl.innerHTML = articles.slice(0, 6).map((article) => `
        <article class="insight-card reveal">
          <span class="insight-date">${formatArticleDate(article.publishedAt)}</span>
          <h3>${article.title || 'Untitled update'}</h3>
          <p>${article.summary || ''}</p>
          <a class="insight-link" href="/article?slug=${encodeURIComponent(article.slug)}">Read article →</a>
        </article>
      `).join('');

      // Re-observe the newly injected cards so they scroll-reveal too.
      observeReveals(listEl.querySelectorAll('.reveal'));
    } catch (error) {
      listEl.innerHTML = `
        <article class="insight-card">
          <span class="insight-date">Temporarily unavailable</span>
          <h3>Could not load updates</h3>
          <p>Please try again shortly.</p>
        </article>
      `;
    }
  }

  // Scroll-reveal
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  ) : null;

  function observeReveals(nodes) {
    if (!io) {
      nodes.forEach((el) => el.classList.add('in'));
      return;
    }
    nodes.forEach((el) => io.observe(el));
  }

  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  } else {
    observeReveals(document.querySelectorAll('.reveal'));
  }

  loadArticles();

  // Scroll story — pinned section, active frame derived from scroll progress through the track
  (function initScrollStory() {
    const track = document.querySelector('.scrollstory-track');
    if (!track) return;
    const frames = track.querySelectorAll('.scrollstory-left .story-frame');
    const imgs   = track.querySelectorAll('.scrollstory-stage .frame-img');
    const accent = track.querySelector('.scrollstory-accent');
    const total = parseInt(track.dataset.frames || frames.length, 10);
    if (!total) return;

    // Below tablet, scroll story collapses to a stacked column — show all frames active.
    const isStacked = () => window.matchMedia('(max-width: 900px)').matches;
    if (isStacked()) {
      frames.forEach((el) => el.classList.add('is-active'));
      imgs.forEach((el) => el.classList.add('is-active'));
      return;
    }

    const animateFrameWords = (idx) => {
      if (typeof gsap === 'undefined') return;
      const frame = frames[idx];
      if (!frame) return;
      const words = frame.querySelectorAll('.story-word');
      if (!words.length) return;
      gsap.fromTo(words,
        { opacity: 0, y: 28, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 0.08 }
      );
    };

    let current = -1;
    const setActive = (idx) => {
      if (idx === current) return;
      const prev = current;
      current = idx;
      frames.forEach((el, i) => {
        el.classList.toggle('is-active', i === idx);
        el.classList.toggle('is-leaving', i === prev);
      });
      imgs.forEach((el, i) => el.classList.toggle('is-active', i === idx));
      if (accent) {
        for (let n = 1; n <= 5; n++) accent.classList.remove(`accent-${n}`);
        accent.classList.add(`accent-${idx + 1}`);
      }
      animateFrameWords(idx);
    };

    let raf = null;
    const compute = () => {
      raf = null;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // The track is N×100vh tall. When its top reaches viewport top, frame 0 starts;
      // when its bottom reaches viewport bottom, frame N-1 ends.
      const totalScroll = track.offsetHeight - vh;
      const scrolled = Math.max(0, Math.min(totalScroll, -rect.top));
      const progress = totalScroll > 0 ? scrolled / totalScroll : 0;
      // Map progress 0..1 to frame index 0..N-1, with each frame holding for 1/N of the scroll.
      const idx = Math.max(0, Math.min(total - 1, Math.floor(progress * total)));
      setActive(idx);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (isStacked()) {
        frames.forEach((el) => el.classList.add('is-active'));
        imgs.forEach((el) => el.classList.add('is-active'));
      } else {
        compute();
      }
    });
  })();

  // Feaster spotlight — each line is a colored tag (block + text together)
  // that slides in from the left or right on scroll. Text sits on top of
  // the block so they animate as one unit.
  (function initFeasterSpotlight() {
    const lines = document.querySelectorAll('.feaster-spotlight .fs-line');
    if (!lines.length) return;
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    lines.forEach((line, i) => {
      const block = line.querySelector('.fs-line-block');
      const color = line.dataset.color;
      if (block && color) block.style.background = color;

      const fromLeft = line.classList.contains('fs-line--from-left');
      const startX   = fromLeft ? -120 : 120;

      gsap.set(line, { xPercent: startX, opacity: 0 });

      gsap.to(line, {
        xPercent: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        delay: i * 0.12,
        scrollTrigger: {
          trigger: line,
          start: 'top 88%',
          once: true,
        },
      });
    });
  })();

  // ========== Hero hexagonal network with flowing current ==========
  (function initHeroHexNetwork() {
    const canvas = document.getElementById('hero-hex');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement; // .hero-bg

    const BRAND = ['#3b82f6', '#8b5cf6', '#ec4899', '#67e8f9'];
    const HEX = 58;                 // hexagon radius (px)
    let W = 0, H = 0, dpr = 1;
    let nodes = [], edges = [], adj = [], pulses = [];
    let raf = null;

    const hexToRgba = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };

    function buildGrid() {
      nodes = []; edges = []; adj = [];
      const map = new Map();
      const round = (v) => Math.round(v / 2) * 2;
      const key = (x, y) => round(x) + ',' + round(y);
      const addNode = (x, y) => {
        const k = key(x, y);
        if (map.has(k)) return map.get(k);
        const id = nodes.length;
        nodes.push({ x, y }); adj.push([]); map.set(k, id);
        return id;
      };
      const r = HEX;
      const w = Math.sqrt(3) * r;   // pointy-top horizontal spacing
      const vstep = 1.5 * r;        // vertical spacing
      const cols = Math.ceil(W / w) + 2;
      const rows = Math.ceil(H / vstep) + 2;
      const eset = new Set();
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * w + (Math.abs(row % 2) === 1 ? w / 2 : 0);
          const cy = row * vstep;
          const corners = [];
          for (let i = 0; i < 6; i++) {
            const ang = (Math.PI / 180) * (60 * i - 90);
            corners.push(addNode(cx + r * Math.cos(ang), cy + r * Math.sin(ang)));
          }
          for (let i = 0; i < 6; i++) {
            const a = corners[i], b = corners[(i + 1) % 6];
            if (a === b) continue;
            const ek = a < b ? a + '-' + b : b + '-' + a;
            if (eset.has(ek)) continue;
            eset.add(ek);
            edges.push([a, b]);
            adj[a].push(b); adj[b].push(a);
          }
        }
      }
    }

    const spawnPulse = () => {
      if (!nodes.length) return null;
      const from = Math.floor(Math.random() * nodes.length);
      if (!adj[from] || !adj[from].length) return null;
      const to = adj[from][Math.floor(Math.random() * adj[from].length)];
      return {
        from, to, t: 0,
        speed: 0.024 + Math.random() * 0.030,   // fast — like electricity
        color: BRAND[Math.floor(Math.random() * BRAND.length)],
        trail: [],
      };
    };

    const step = (p) => {
      p.t += p.speed;
      if (p.t >= 1) {
        p.t -= 1;
        const prev = p.from;
        p.from = p.to;
        const nb = adj[p.from];
        let choices = nb.filter((n) => n !== prev);
        if (!choices.length) choices = nb;
        p.to = choices[Math.floor(Math.random() * choices.length)];
      }
    };

    const pos = (p) => {
      const a = nodes[p.from], b = nodes[p.to];
      return { x: a.x + (b.x - a.x) * p.t, y: a.y + (b.y - a.y) * p.t };
    };

    function drawStatic() {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      for (const [a, b] of edges) {
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      drawStatic();
      ctx.lineCap = 'round';
      for (const p of pulses) {
        const point = pos(p);
        p.trail.unshift(point);
        if (p.trail.length > 9) p.trail.pop();        // short, snappy trail
        const flick = 0.5 + Math.random() * 0.5;       // electric flicker
        for (let i = 0; i < p.trail.length - 1; i++) {
          const t0 = p.trail[i], t1 = p.trail[i + 1];
          const f = 1 - i / p.trail.length;
          ctx.strokeStyle = hexToRgba(p.color, f * 0.85 * flick);
          ctx.lineWidth = f * 2.2 + 0.5;
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.stroke();
        }
        ctx.shadowBlur = 14 * flick;
        ctx.shadowColor = p.color;
        ctx.fillStyle = hexToRgba(p.color, 0.6 + 0.4 * flick);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.0 + flick * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        step(p);
      }
      raf = requestAnimationFrame(frame);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth;
      H = host.clientHeight;
      if (!W || !H) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
      const count = Math.max(7, Math.min(18, Math.round((W * H) / 85000)));
      pulses = [];
      for (let i = 0; i < count; i++) {
        const p = spawnPulse();
        if (p) pulses.push(p);
      }
    }

    let resizeT;
    window.addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(resize, 200);
    });

    resize();
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, W, H);
      drawStatic();
    } else if (W && H) {
      frame();
    }
  })();

})();
