(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ========== UtahOp analytics (pageviews + intent events) ==========
  // Publishable browser key only — origin-locked to rylolabz.com by UtahOp
  // itself, safe to ship in client JS. Leads/bookings/messages need the
  // secret key and must be called from a server, so they are NOT wired
  // here — this site has no contact form yet, only mailto:/wa.me links,
  // which carry no visitor-supplied contact data to submit as a lead.
  (function uopAnalytics() {
    const UOP_BASE = 'https://yuta-opp.vercel.app/api/v1';
    const UOP_PUBLIC_KEY = 'uop_pub_R8PFozyZpR9K_8gpMaolsWjThRAr9w1uh2grBrql6jGQ2pL210vETJDO';

    function visitorId() {
      try {
        let v = localStorage.getItem('uop_vid');
        if (!v) {
          v = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
          localStorage.setItem('uop_vid', v);
        }
        return v;
      } catch (e) { return null; }
    }

    function utmParams() {
      try {
        const stored = sessionStorage.getItem('uop_utm');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      const q = new URLSearchParams(location.search);
      const utm = {
        utm_source: q.get('utm_source'),
        utm_medium: q.get('utm_medium'),
        utm_campaign: q.get('utm_campaign'),
        utm_term: q.get('utm_term'),
        utm_content: q.get('utm_content'),
      };
      if (Object.values(utm).some(Boolean)) {
        try { sessionStorage.setItem('uop_utm', JSON.stringify(utm)); } catch (e) {}
      }
      return utm;
    }

    function track(name, meta) {
      try {
        const body = Object.assign({
          name,
          path: location.pathname,
          referrer: document.referrer || null,
          visitor_id: visitorId(),
          session_id: null,
        }, utmParams());
        if (meta) body.meta = meta;

        fetch(`${UOP_BASE}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': UOP_PUBLIC_KEY },
          body: JSON.stringify(body),
          keepalive: true,
        }).catch(() => {});
      } catch (e) {}
    }

    window.uopTrack = track;
    window.uopVisitorId = visitorId;
    window.uopUtm = utmParams;
    track('pageview');

    // Fire a lightweight intent event for every contact-facing CTA click.
    // Fire-and-forget: keepalive lets the request survive the navigation
    // a mailto:/wa.me/tel: link or external link triggers immediately after.
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-uop-event]');
      if (el) track(el.getAttribute('data-uop-event'));
    });
  })();

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

  // Transparent over the hero photo, flips to a solid bar once the
  // user scrolls into the light content below it.
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

  // ========== Contact form -> /api/lead -> UtahOp ==========
  (function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const statusEl = form.querySelector('.contact-form-status');
    const submitBtn = form.querySelector('.contact-form-submit');
    const submitLabel = form.querySelector('.contact-form-submit-label');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const phone = String(data.get('phone') || '').trim();

      if (!name) {
        statusEl.textContent = 'Please tell us your name.';
        statusEl.dataset.state = 'err';
        return;
      }
      if (!email && !phone) {
        statusEl.textContent = 'Add an email or phone number so we can reply.';
        statusEl.dataset.state = 'err';
        return;
      }

      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';
      statusEl.textContent = '';
      statusEl.removeAttribute('data-state');

      const utm = (typeof window.uopUtm === 'function') ? window.uopUtm() : {};

      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            company: String(data.get('company') || '').trim(),
            message: String(data.get('message') || '').trim(),
            visitor_id: (typeof window.uopVisitorId === 'function') ? window.uopVisitorId() : null,
            landing_page: location.pathname,
            ...utm,
          }),
        });

        if (!response.ok) throw new Error('Request failed');

        statusEl.textContent = "Thanks — we've got it. We'll be in touch shortly.";
        statusEl.dataset.state = 'ok';
        submitLabel.textContent = 'Sent';
        form.reset();
        if (typeof window.uopTrack === 'function') window.uopTrack('form_submit');
      } catch (err) {
        statusEl.textContent = "Something went wrong sending that. Try WhatsApp or email above instead.";
        statusEl.dataset.state = 'err';
        submitBtn.disabled = false;
        submitLabel.textContent = 'Send message';
      }
    });
  })();
})();
