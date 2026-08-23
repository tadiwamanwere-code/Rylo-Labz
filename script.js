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
})();
