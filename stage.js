/* Homepage extras:
   1. the hero video and its on-load reveal
   2. the live client sites shown inside browser frames
   Kept out of script.js so the rest of the site loads the same everywhere. */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Hero ----------
  function hero() {
    var el = document.querySelector('.hero-v');
    if (!el) return;

    // Show the copy as soon as the page is usable, not when the video is ready.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-in'); });
    });

    var video = el.querySelector('.hero-v-video');
    if (!video) return;

    if (reduced) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    // Some phones block autoplay until the user touches the page.
    var tryPlay = function () {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    };
    tryPlay();
    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });

    // Stop the video while the hero is off screen, so scrolling stays smooth.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) tryPlay();
          else video.pause();
        });
      }, { threshold: 0.05 }).observe(el);
    }
  }

  // ---------- 2. Live client sites in browser frames ----------
  function liveFrames() {
    var frames = Array.prototype.slice.call(document.querySelectorAll('.browser-vp'));
    if (!frames.length) return;

    function fit(vp) {
      var iframe = vp.querySelector('iframe');
      if (!iframe) return;
      var scale = vp.clientWidth / 1440;
      iframe.style.transform = 'scale(' + scale + ')';
      iframe.style.height = (vp.clientHeight / scale) + 'px';
    }

    function mount(vp) {
      var iframe = vp.querySelector('iframe');
      var poster = vp.querySelector('.frame-poster');
      if (!iframe || iframe.src) return;
      fit(vp);
      iframe.src = iframe.dataset.src;
      var show = function () {
        iframe.classList.add('loaded');
        if (poster) poster.classList.add('hide');
      };
      iframe.addEventListener('load', show);
      setTimeout(show, 3500); // some sites never fire load, show them anyway
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          mount(entry.target);
          obs.unobserve(entry.target);
        });
      }, { rootMargin: '200px' });
      frames.forEach(function (vp) { io.observe(vp); });
    } else {
      frames.forEach(mount);
    }

    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { frames.forEach(fit); }, 150);
    });
  }

  function init() {
    hero();
    liveFrames();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
