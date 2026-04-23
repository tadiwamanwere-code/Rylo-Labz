(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  // -----------------------------
  // Splash intro orchestration
  // -----------------------------
  const splash = document.getElementById('splash');
  const SPLASH_MS = prefersReducedMotion ? 0 : 3100;
  if (splash) {
    document.body.classList.add('splash-active');
    if (prefersReducedMotion) {
      splash.remove();
      document.body.classList.remove('splash-active');
    } else {
      setTimeout(() => {
        splash.classList.add('done');
        document.body.classList.remove('splash-active');
        setTimeout(() => splash.remove(), 1200);
      }, SPLASH_MS);
    }
  }

  // Hero word reveal — triggers when splash is about to end
  const heroTitleWords = document.querySelectorAll('.hero-title .word');
  const heroRevealTargets = document.querySelectorAll('.hero [data-reveal-delay]');
  const heroStats = document.querySelectorAll('.hero-stats .hstat');
  const triggerHero = () => {
    heroTitleWords.forEach((w) => w.classList.add('in'));
    heroRevealTargets.forEach((el) => {
      const delay = parseInt(el.dataset.revealDelay || '0', 10);
      setTimeout(() => el.classList.add('in'), delay);
    });
    setTimeout(() => heroStats.forEach((s) => s.classList.add('in')), 2200);
    animateCounters();
  };
  if (prefersReducedMotion) {
    triggerHero();
  } else {
    // Let splash do its thing; start hero animations slightly before it exits
    setTimeout(triggerHero, Math.max(0, SPLASH_MS - 1200));
  }

  // -----------------------------
  // Rotating word
  // -----------------------------
  const rotator = document.querySelector('.rotator');
  if (rotator && !prefersReducedMotion) {
    const words = (rotator.dataset.words || '').split('|').filter(Boolean);
    let idx = 0;
    const cycle = () => {
      idx = (idx + 1) % words.length;
      rotator.classList.add('swap');
      setTimeout(() => { rotator.textContent = words[idx]; }, 280);
      setTimeout(() => rotator.classList.remove('swap'), 620);
    };
    setTimeout(() => setInterval(cycle, 2600), SPLASH_MS + 1800);
  }

  // -----------------------------
  // Live clock (CAT = UTC+2)
  // -----------------------------
  const clock = document.getElementById('hero-clock');
  if (clock) {
    const pad = (n) => String(n).padStart(2, '0');
    const tickClock = () => {
      const now = new Date();
      const cat = new Date(now.getTime() + (now.getTimezoneOffset() + 120) * 60000);
      clock.textContent = `${pad(cat.getHours())}:${pad(cat.getMinutes())}:${pad(cat.getSeconds())}`;
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  // -----------------------------
  // Counter animation for hero stats
  // -----------------------------
  function animateCounters() {
    document.querySelectorAll('.hstat-num[data-count-to]').forEach((el) => {
      const target = parseFloat(el.dataset.countTo);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const format = el.dataset.format || '';
      const duration = 1600;
      const start = performance.now();
      const fmt = (v) => {
        if (format === 'k' && v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'K';
        if (target < 10) return v.toFixed(1);
        return Math.round(v).toLocaleString();
      };
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + fmt(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + fmt(target) + suffix;
      };
      requestAnimationFrame(tick);
    });
  }

  // -----------------------------
  // Magnetic elements
  // -----------------------------
  // Each .magnetic element eases toward the cursor when within a radius.
  const magnets = Array.from(document.querySelectorAll('.magnetic')).map((el) => {
    const strength = parseFloat(el.dataset.magneticStrength || '0.3');
    return { el, strength, x: 0, y: 0, tx: 0, ty: 0, active: false };
  });

  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Cursor hover state
  magnets.forEach(({ el }) => {
    el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
  });

  // Cards with a radial spotlight that tracks the cursor
  document.querySelectorAll('.feature-card, .pipe-card, .metric-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });

  // Animation loop
  const lerp = (a, b, n) => a + (b - a) * n;

  function tick() {
    if (!prefersReducedMotion && !isTouch) {
      // Cursor
      cursorX = lerp(cursorX, mouseX, 0.22);
      cursorY = lerp(cursorY, mouseY, 0.22);
      if (cursor) cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
      if (cursorDot) cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

      // Magnets
      magnets.forEach((m) => {
        const rect = m.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Radius scales a bit with element size but is capped.
        const radius = Math.max(rect.width, rect.height) * 0.9 + 40;

        if (dist < radius) {
          m.tx = dx * m.strength;
          m.ty = dy * m.strength;
        } else {
          m.tx = 0;
          m.ty = 0;
        }
        m.x = lerp(m.x, m.tx, 0.18);
        m.y = lerp(m.y, m.ty, 0.18);
        if (Math.abs(m.x) < 0.01 && Math.abs(m.y) < 0.01) {
          m.el.style.transform = '';
        } else {
          m.el.style.transform = `translate3d(${m.x.toFixed(2)}px, ${m.y.toFixed(2)}px, 0)`;
        }
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // -----------------------------
  // Subtle parallax on gradient orbs
  // -----------------------------
  const orbs = document.querySelectorAll('.gradient-orb');
  window.addEventListener('mousemove', (e) => {
    if (prefersReducedMotion) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    orbs.forEach((orb, i) => {
      const depth = (i + 1) * 12;
      orb.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });

  // -----------------------------
  // Reveal on scroll
  // -----------------------------
  const revealTargets = document.querySelectorAll(
    '.hero-eyebrow, .hero-title, .hero-subtitle, .hero-actions, .hero-stats, .marquee, .section-header, .mission-copy, .mission-metrics > *, .feature-card, .pipe-card, .timeline-items .ti, .company-copy, .company-portrait, .stats-band > *, .contact-inner > *, .evidence-copy > *, .evidence-imgs > *'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => io.observe(el));

  // Hide custom cursor on touch devices
  if (isTouch) {
    cursor?.remove();
    cursorDot?.remove();
  }
})();
