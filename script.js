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

  // Feaster spotlight — colored block sweeps in over each line, then sweeps
  // out the other side, revealing the text underneath. Direction (left or
  // right) is set per line via .fs-line--from-left / .fs-line--from-right.
  (function initFeasterSpotlight() {
    const lines = document.querySelectorAll('.feaster-spotlight .fs-line');
    if (!lines.length) return;
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    lines.forEach((line, i) => {
      const block   = line.querySelector('.fs-line-block');
      const content = line.querySelector('.fs-line-content');
      const color   = line.dataset.color;
      if (!block || !content) return;

      if (color) block.style.background = color;

      const fromLeft = line.classList.contains('fs-line--from-left');
      const enterFrom = fromLeft ? -101 : 101;
      const exitTo    = fromLeft ?  101 : -101;

      gsap.set(block,   { xPercent: enterFrom });
      gsap.set(content, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: line,
          start: 'top 88%',
          once: true,
        },
        delay: i * 0.08,
      });

      tl.to(block,   { xPercent: 0,      duration: 0.42, ease: 'power3.inOut' })
        .set(content, { opacity: 1 })
        .to(block,   { xPercent: exitTo, duration: 0.42, ease: 'power3.inOut' });
    });
  })();

})();
