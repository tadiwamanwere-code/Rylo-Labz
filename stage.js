/* =========================================================
   Homepage stage, live site frames and the UtahOp demo card.

   The stage pins the hero while the next panel is lifted over it like
   a sheet, with the drone flying along the top edge so it reads as the
   drone doing the pulling. The sheet and its ripple are drawn in WebGL
   (three.js). Without WebGL, or when the visitor asks for less motion,
   it falls back to a plain rise with no wave.
   ========================================================= */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Live site previews ---------- */
  (function liveFrames() {
    const boxes = Array.prototype.slice.call(document.querySelectorAll('.browser-vp'));
    if (!boxes.length) return;

    function fit() {
      boxes.forEach((box) => {
        const frame = box.querySelector('iframe');
        if (!frame || !box.clientWidth) return;
        const scale = box.clientWidth / 1440;
        frame.style.transform = 'scale(' + scale + ')';
      });
    }

    function mount(box) {
      const frame = box.querySelector('iframe');
      if (!frame || frame.dataset.mounted) return;
      frame.dataset.mounted = '1';
      const poster = box.querySelector('.frame-poster');
      const reveal = () => {
        frame.classList.add('loaded');
        if (poster) poster.classList.add('hide');
      };
      frame.addEventListener('load', reveal);
      fit();
      frame.src = frame.getAttribute('data-src');
      // Cross-origin load events are unreliable, so reveal anyway.
      setTimeout(reveal, 3500);
    }

    fit();
    window.addEventListener('resize', fit, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            mount(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '300px' });
      boxes.forEach((box) => io.observe(box));
    } else {
      boxes.forEach(mount);
    }
  })();

  /* ---------- UtahOp demo card: the tabs really switch ---------- */
  (function utahDemo() {
    const app = document.getElementById('utah-app');
    if (!app) return;
    const tabs = app.querySelectorAll('.utah-tabs button');
    const panels = app.querySelectorAll('.utah-rows');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.toggle('on', t === tab));
        panels.forEach((panel) => {
          panel.hidden = panel.getAttribute('data-panel') !== tab.dataset.tab;
        });
      });
    });
  })();

  /* ---------- The stage ---------- */
  const stage = document.querySelector('.stage');
  if (!stage) return;

  const canvas = stage.querySelector('.stage-canvas');
  const fold = stage.querySelector('.stage-fold');
  const foldInner = stage.querySelector('.stage-fold-inner');
  const heroCopy = stage.querySelector('.stage-hero');
  const flyer = stage.querySelector('.stage-flyer');
  const heroImg = stage.querySelector('.stage-landscape');
  const foldImg = stage.querySelector('.stage-fold-bg');

  if (reduced || !fold) {
    stage.classList.add('stage--static');
    return;
  }

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const smooth = (a, b, t) => {
    const x = clamp((t - a) / (b - a));
    return x * x * (3 - 2 * x);
  };

  // How high the sheet sits at a given horizontal spot, in 0 to 1 of the
  // screen height. Kept in step with the same maths in the shader so the
  // drone sits on the edge it is supposedly lifting.
  const LIFT = 0.08;
  function edgeAt(x, progress, droneX) {
    const lift = Math.exp(-Math.pow((x - droneX) * 3.2, 2)) * LIFT;
    return progress * 1.3 - 0.15 + lift * smooth(0.02, 0.2, progress);
  }

  let gl = null;
  if (window.THREE && canvas) {
    try {
      gl = createGl();
    } catch (err) {
      gl = null;
    }
  }
  if (gl) stage.classList.add('stage--gl');

  function createGl() {
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const loader = new THREE.TextureLoader();

    const phone = window.matchMedia('(max-width: 640px)');
    const heroPhoneSrc = '/images/hero-rooftop-mobile.jpg';
    const heroWideSrc = '/images/hero-rooftop-desktop.jpg';
    const heroSrc = phone.matches ? heroPhoneSrc : heroWideSrc;
    const foldPhoneSrc = '/images/night-city-mobile.jpg';
    const foldWideSrc = '/images/night-city.jpg';
    const foldSrc = phone.matches ? foldPhoneSrc : foldWideSrc;
    if (!heroSrc || !foldSrc) throw new Error('missing stage images');

    const uniforms = {
      uHero: { value: loader.load(heroSrc, onTex) },
      uFold: { value: loader.load(foldSrc, onTex) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uHeroAspect: { value: 2.32 },
      uFoldAspect: { value: 2.32 },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uDroneX: { value: 0.1 },
      uHeroShift: { value: phone.matches ? 0 : -0.06 }
    };

    function onTex(tex) {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      if (tex.image && tex.image.width) {
        const aspect = tex.image.width / tex.image.height;
        if (tex === uniforms.uHero.value) uniforms.uHeroAspect.value = aspect;
        if (tex === uniforms.uFold.value) uniforms.uFoldAspect.value = aspect;
      }
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position.xy, 0.0, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform sampler2D uHero;',
        'uniform sampler2D uFold;',
        'uniform vec2 uRes;',
        'uniform float uHeroAspect;',
        'uniform float uFoldAspect;',
        'uniform float uProgress;',
        'uniform float uTime;',
        'uniform float uDroneX;',
        'uniform float uHeroShift;',
        'vec2 cover(vec2 uv, float imgAspect) {',
        '  float screen = uRes.x / uRes.y;',
        '  vec2 s = screen > imgAspect ? vec2(1.0, imgAspect / screen) : vec2(screen / imgAspect, 1.0);',
        '  return (uv - 0.5) / s + 0.5;',
        '}',
        'void main() {',
        '  vec2 uv = vUv;',
        '  float x = uv.x;',
        '  float settle = smoothstep(0.02, 0.3, uProgress) * (1.0 - smoothstep(0.88, 1.0, uProgress));',
        '  float wave = (sin(x * 7.0 + uTime * 0.9) * 0.028 + sin(x * 15.0 - uTime * 1.4) * 0.012) * settle;',
        '  float lift = exp(-pow((x - uDroneX) * 3.2, 2.0)) * 0.08 * smoothstep(0.02, 0.2, uProgress);',
        '  float edge = uProgress * 1.3 - 0.15 + wave + lift;',
        '  float d = edge - uv.y;',
        '  float m = smoothstep(-0.003, 0.003, d);',
        '  float crease = exp(-abs(d) * 26.0) * settle;',
        '  vec2 foldUv = cover(uv + vec2(sin(d * 38.0 - uTime * 2.0) * 0.012 * crease, 0.0), uFoldAspect);',
        '  vec2 heroUv = cover(uv + vec2(uHeroShift, -0.025 * uProgress), uHeroAspect);',
        '  vec3 hero = texture2D(uHero, heroUv).rgb * (1.0 - 0.22 * uProgress);',
        '  vec3 panel = texture2D(uFold, foldUv).rgb;',
        '  vec3 col = mix(hero, panel, m);',
        '  col += vec3(0.85, 0.95, 0.66) * crease * 0.12;',
        '  float shadeLeft = smoothstep(0.78, 0.0, uv.x) * 0.5;',
        '  float shadeFoot = smoothstep(0.5, 0.0, uv.y) * 0.5;',
        '  col *= 1.0 - shadeLeft * 0.55 - shadeFoot * 0.5;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    function resize() {
      const w = stage.querySelector('.stage-viewport').clientWidth;
      const h = stage.querySelector('.stage-viewport').clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
      uniforms.uHeroShift.value = phone.matches ? 0 : -0.06;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const swapHero = () => {
      const next = loader.load(phone.matches ? heroPhoneSrc : heroWideSrc, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (tex.image && tex.image.width) uniforms.uHeroAspect.value = tex.image.width / tex.image.height;
      });
      uniforms.uHero.value = next;
      const nextFold = loader.load(phone.matches ? foldPhoneSrc : foldWideSrc, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (tex.image && tex.image.width) uniforms.uFoldAspect.value = tex.image.width / tex.image.height;
      });
      uniforms.uFold.value = nextFold;
    };
    if (phone.addEventListener) phone.addEventListener('change', swapHero);

    return {
      draw(progress, time, droneX) {
        uniforms.uProgress.value = progress;
        uniforms.uTime.value = time;
        uniforms.uDroneX.value = droneX;
        renderer.render(scene, camera);
      }
    };
  }

  let running = true;
  let start = performance.now();

  function frame(now) {
    if (!running) return;
    const time = (now - start) / 1000;
    const range = stage.offsetHeight - window.innerHeight;
    const p = range > 0 ? clamp(-stage.getBoundingClientRect().top / range) : 0;
    const rise = ease(clamp((p - 0.1) / 0.62));
    const droneX = 0.08 + p * 0.84;

    if (gl) {
      gl.draw(rise, time, droneX);
    } else {
      fold.style.clipPath = 'inset(' + (1 - rise) * 100 + '% 0 0 0)';
      if (foldImg) foldImg.style.transform = 'translate3d(0, ' + (1 - rise) * 6 + '%, 0)';
    }

    if (heroImg && !gl) heroImg.style.transform = 'scale(' + (1.08 - p * 0.08) + ')';
    if (heroCopy) {
      heroCopy.style.transform = 'translate3d(0, ' + -rise * 70 + 'px, 0)';
      const heroFade = clamp(1 - rise * 1.9);
      heroCopy.style.opacity = String(heroFade);
      heroCopy.style.visibility = heroFade < 0.02 ? 'hidden' : 'visible';
    }
    if (foldInner) {
      const show = smooth(0.35, 0.8, rise);
      foldInner.style.opacity = String(show);
      foldInner.style.transform = 'translate3d(0, ' + (1 - show) * 60 + 'px, 0)';
    }
    if (flyer) {
      // Ride the top edge of the sheet, tilting into the direction of travel.
      const edge = edgeAt(droneX, rise, droneX);
      const top = (1 - Math.min(edge, 0.95)) * 100;
      flyer.style.left = droneX * 100 + '%';
      flyer.style.top = Math.max(2, top - 9) + '%';
      flyer.style.transform = 'translate(-50%, -50%) rotate(' + (-5 + p * 10) + 'deg)';
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  // Stop drawing while the stage is off screen.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !running) {
          running = true;
          start = performance.now();
          requestAnimationFrame(frame);
        } else if (!entry.isIntersecting) {
          running = false;
        }
      });
    }, { threshold: 0 });
    io.observe(stage);
  }
})();
