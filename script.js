(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- AUDIO (Web Audio, with mute) ---------- */
  let ctx = null, master = null;
  let muted = store.get('pip-muted', '0') === '1';

  function ensureAudio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, o = {}) {
    if (muted) return;
    const c = ensureAudio();
    if (!c) return;
    const dur = o.dur || 0.8, type = o.type || 'sine', vol = o.vol || 0.2, when = o.when || 0;
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function musicNote(freq) {
    tone(freq, { dur: 1.2, vol: 0.22 });
    tone(freq * 2, { dur: 0.6, vol: 0.08 });
    tone(freq * 3, { dur: 0.3, type: 'triangle', vol: 0.03 });
  }

  const sfx = {
    click() {
      tone(660, { dur: 0.12, type: 'square', vol: 0.05 });
      tone(990, { dur: 0.1, type: 'square', vol: 0.04, when: 0.05 });
    },
    giggle() {
      [700, 880, 780, 990].forEach((f, i) => tone(f, { dur: 0.1, type: 'triangle', vol: 0.12, when: i * 0.09 }));
    },
    yawn() {
      [520, 460, 400, 330].forEach((f, i) => tone(f, { dur: 0.35, type: 'sine', vol: 0.12, when: i * 0.22 }));
    }
  };

  const muteBtn = $('#muteBtn');
  function renderMute() {
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
    muteBtn.innerHTML = muted ? '&#128263; Muted' : '&#128266; Sound';
    if (master) master.gain.value = muted ? 0 : 0.6;
  }
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    store.set('pip-muted', muted ? '1' : '0');
    renderMute();
    if (!muted) { ensureAudio(); sfx.click(); }
  });
  renderMute();

  // unlock audio on first touch/click (iOS needs a user gesture)
  window.addEventListener('pointerdown', () => { if (!muted) ensureAudio(); }, { once: true });

  // click sound on every button/link (except ones that make their own sound)
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a');
    if (!el || el.closest('[data-nosfx]') || el.id === 'muteBtn' || el.id === 'pip' || el.classList.contains('star')) return;
    sfx.click();
  });

  /* ---------- Sky stars ---------- */
  (function makeStars() {
    const box = $('#stars');
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('span');
      const size = 1 + Math.random() * 2.5;
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(2 + Math.random() * 3).toFixed(2)}s`;
      box.appendChild(s);
    }
  })();

  /* ---------- Theme (day / night) ---------- */
  const root = document.documentElement;
  const themeBtn = $('#themeBtn');
  const speech = $('#speech');
  function say(t) { speech.textContent = t; }

  function setTheme(t, announce) {
    root.dataset.theme = t;
    store.set('pip-theme', t);
    themeBtn.innerHTML = t === 'night' ? '&#9728; Day' : '&#9790; Night';
    themeBtn.setAttribute('aria-label', t === 'night' ? 'Switch to day mode' : 'Switch to night mode');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'night' ? '#120f33' : '#9fdcff');
    if (announce) say(t === 'night' ? 'Shh… the dreams are awake!' : 'Good morning! Wait, why am I awake?');
  }
  themeBtn.addEventListener('click', () => setTheme(root.dataset.theme === 'night' ? 'day' : 'night', true));
  setTheme(store.get('pip-theme', 'night') === 'day' ? 'day' : 'night', false);

  /* ---------- Pip: leans toward the pointer / touch ---------- */
  const hero = $('#top');
  const pipBtn = $('#pip');
  const pipFrame = $('.pip-frame');
  let tx = 0, ty = 0, cx = 0, cy = 0, lastMove = 0, asleep = false;

  function aim(x, y) {
    const r = pipFrame.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, dist / 300);
    tx = (dx / dist) * k;
    ty = (dy / dist) * k;
    lastMove = performance.now();
  }
  window.addEventListener('pointermove', (e) => aim(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) aim(t.clientX, t.clientY); }, { passive: true });

  function tiltLoop(now) {
    if (asleep) { tx = 0; ty = 0.3; }
    else if (!reduceMotion && now - lastMove > 3000) { tx = Math.sin(now / 1500) * 0.4; ty = Math.cos(now / 1900) * 0.2; }
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    pipFrame.style.setProperty('--tx', cx.toFixed(3));
    pipFrame.style.setProperty('--ty', cy.toFixed(3));
    requestAnimationFrame(tiltLoop);
  }
  requestAnimationFrame(tiltLoop);

  /* ---------- Easter egg: 5 pokes put Pip to sleep ---------- */
  let pokes = 0, pokeTimer = null;
  const pokeLines = ['Hehe!', 'Ooh, tickly!', 'Hee hee hee!', 'Pip is getting sleepy…'];

  function sleepPip() {
    asleep = true;
    hero.classList.add('asleep');
    say('Zzz… you found my secret lullaby! (poke me to wake me up)');
    sfx.yawn();
    setTimeout(() => { if (asleep) lullaby.play(); }, 900);
  }
  function wakePip() {
    asleep = false;
    pokes = 0;
    hero.classList.remove('asleep');
    lullaby.stop();
    sfx.giggle();
    say('Huh? I was dreaming about clouds!');
  }
  pipBtn.addEventListener('click', () => {
    pipBtn.classList.remove('boing');
    void pipBtn.offsetWidth;
    pipBtn.classList.add('boing');
    if (asleep) { wakePip(); return; }
    pokes++;
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => { pokes = 0; }, 2500);
    sfx.giggle();
    if (pokes >= 5) { sleepPip(); return; }
    say(pokeLines[pokes - 1]);
  });

  /* ---------- Odometer (Dreams delivered) ---------- */
  const odo = $('#odometer');
  let dreams = 1204 + Number(store.get('pip-visits', '0'));
  store.set('pip-visits', String(Number(store.get('pip-visits', '0')) + 1));
  let digitCount = 0;

  function renderOdo(n) {
    const str = String(n).padStart(6, '0');
    if (digitCount !== str.length) {
      odo.innerHTML = '';
      digitCount = str.length;
      for (let i = 0; i < str.length; i++) {
        const d = document.createElement('span');
        d.className = 'digit';
        const strip = document.createElement('span');
        strip.className = 'strip';
        for (let k = 0; k < 10; k++) { const s = document.createElement('span'); s.textContent = k; strip.appendChild(s); }
        d.appendChild(strip);
        odo.appendChild(d);
      }
    }
    $$('.strip', odo).forEach((strip, i) => { strip.style.transform = `translateY(${-1.4 * Number(str[i])}em)`; });
    odo.setAttribute('aria-label', `Dreams delivered: ${n}`);
  }
  renderOdo(dreams - 1);
  setTimeout(() => renderOdo(dreams), 600);
  setInterval(() => { dreams += 1; renderOdo(dreams); }, 9000);

  /* ---------- Sparkle cursor trail ---------- */
  const cv = $('#sparkles');
  const g2 = cv.getContext('2d');
  let W = 0, H = 0;
  const parts = [];
  const colors = ['#ffe08a', '#ff9ecb', '#b9a7ff', '#9be7ff'];
  let running = false, lastX = -100, lastY = -100;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function drawStar(x, y, s, rot) {
    g2.save();
    g2.translate(x, y);
    g2.rotate(rot);
    g2.beginPath();
    g2.moveTo(0, -s);
    g2.quadraticCurveTo(0, 0, s, 0);
    g2.quadraticCurveTo(0, 0, 0, s);
    g2.quadraticCurveTo(0, 0, -s, 0);
    g2.quadraticCurveTo(0, 0, 0, -s);
    g2.fill();
    g2.restore();
  }
  function sparkleFrame() {
    g2.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= 0.022;
      p.x += p.vx; p.y += p.vy; p.rot += 0.05;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      g2.globalAlpha = p.life;
      g2.fillStyle = p.c;
      drawStar(p.x, p.y, p.size * p.life + 1, p.rot);
    }
    g2.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(sparkleFrame);
    else { running = false; g2.clearRect(0, 0, W, H); }
  }
  function spawn(x, y) {
    for (let i = 0; i < 2; i++) {
      parts.push({ x, y, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 1 + 0.3, life: 1, size: 5 + Math.random() * 7, c: colors[Math.floor(Math.random() * colors.length)], rot: Math.random() * 6 });
    }
    if (parts.length > 90) parts.splice(0, parts.length - 90);
    if (!running) { running = true; requestAnimationFrame(sparkleFrame); }
  }
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 14) return;
      lastX = e.clientX; lastY = e.clientY;
      spawn(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ---------- Scroll: progress bar + dream route ---------- */
  const progress = $('#progress');
  const track = $('#storyTrack');
  const svg = $('#dreamSvg');
  const faint = $('#dreamFaint');
  const line = $('#dreamLine');
  const moon = $('#moonmark');
  let pathLen = 0;

  function buildPath() {
    const w = track.clientWidth, h = track.clientHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const n = 6;
    const pts = [];
    for (let i = 0; i < n; i++) {
      pts.push({ x: i % 2 === 0 ? w * 0.12 : w * 0.88, y: 10 + (h - 20) * (i / (n - 1)) });
    }
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
      d += ` C ${a.x.toFixed(1)} ${my.toFixed(1)}, ${b.x.toFixed(1)} ${my.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }
    faint.setAttribute('d', d);
    line.setAttribute('d', d);
    pathLen = line.getTotalLength();
    line.style.strokeDasharray = String(pathLen);
    updateRoute();
  }
  function updateRoute() {
    if (!pathLen) return;
    const rect = track.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.6 - rect.top) / rect.height, 0, 1);
    line.style.strokeDashoffset = String(pathLen * (1 - p));
    const pt = line.getPointAtLength(pathLen * p);
    moon.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
  }
  function onScroll() {
    const de = document.documentElement;
    const max = de.scrollHeight - de.clientHeight;
    progress.style.transform = `scaleX(${max > 0 ? de.scrollTop / max : 0})`;
    updateRoute();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', buildPath);
  window.addEventListener('load', () => { buildPath(); onScroll(); });
  buildPath();
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.scene, .card');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.18 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Project 1: Lullaby Lab ---------- */
  const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
  const noteNames = ['C', 'D', 'E', 'G', 'A', 'high C', 'high D', 'high E'];
  const keysBox = $('#keys');
  const starBtns = notes.map((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'star';
    b.setAttribute('aria-label', `Play note ${noteNames[i]}`);
    b.addEventListener('click', () => pressStar(i));
    keysBox.appendChild(b);
    return b;
  });
  function pressStar(i) {
    musicNote(notes[i]);
    const b = starBtns[i];
    b.classList.add('on');
    setTimeout(() => b.classList.remove('on'), 260);
    const mb = $('#musicbox');
    mb.classList.add('tap');
    setTimeout(() => mb.classList.remove('tap'), 260);
  }

  const lullaby = (() => {
    const tune = [[2, 1], [4, 1], [5, 2], [4, 1], [2, 1], [3, 2], [2, 1], [1, 1], [0, 2], [1, 1], [2, 1], [4, 2], [2, 1], [1, 1], [0, 3]];
    const beat = 400;
    const btn = $('#playLullaby');
    let timers = [], playing = false;
    function label() { $('#lab').classList.toggle('playing', playing); btn.innerHTML = playing ? '&#9632; Stop the lullaby' : '&#9654; Play Pip\'s lullaby'; }
    function stop() { timers.forEach(clearTimeout); timers = []; playing = false; label(); }
    function play() {
      stop();
      playing = true;
      label();
      ensureAudio();
      let t = 200;
      tune.forEach(([i, beats]) => {
        timers.push(setTimeout(() => pressStar(i), t));
        t += beats * beat;
      });
      timers.push(setTimeout(() => { playing = false; label(); }, t + 600));
    }
    btn.addEventListener('click', () => { if (playing) stop(); else { if (muted) say('Psst… unmute with the button at the top to hear the lullaby!'); play(); } });
    return { play, stop };
  })();

  /* ---------- Project 2: Nightlights + flashlight dream layer ---------- */
  const lamps = $$('.lamp');
  const dark = $('#darkroom');
  lamps.forEach((l) => l.addEventListener('click', () => {
    l.setAttribute('aria-pressed', String(l.getAttribute('aria-pressed') !== 'true'));
    const all = lamps.every((x) => x.getAttribute('aria-pressed') === 'true');
    dark.classList.toggle('lit', all);
    $('#lights').classList.toggle('all-on', all);
  }));
  function moveLight(e) {
    const r = dark.getBoundingClientRect();
    dark.style.setProperty('--x', (e.clientX - r.left) + 'px');
    dark.style.setProperty('--y', (e.clientY - r.top) + 'px');
  }
  dark.addEventListener('pointermove', moveLight);
  dark.addEventListener('pointerdown', moveLight);

  /* ---------- Guestbook ---------- */
  // Optional: paste your Supabase project URL + anon key (see README) for a live shared guestbook.
  const SUPABASE_URL = '';
  const SUPABASE_ANON_KEY = '';
  const remote = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  const form = $('#guestForm');
  const list = $('#guestList');
  const gnote = $('#guestNote');
  const seed = [
    { name: 'Moonbeam', message: 'Sweet dreams, Pip!' },
    { name: 'Tiny Ghost', message: 'Thanks for the nightlight!' },
    { name: 'Sleepy Cloud', message: 'Zzz... the lullaby was perfect.' }
  ];

  function readLocal() {
    try { const a = JSON.parse(store.get('pip-guestbook', '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  async function loadEntries() {
    if (remote) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/guestbook?select=name,message&order=created_at.desc&limit=30`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!r.ok) throw new Error(String(r.status));
        return await r.json();
      } catch (e) {
        gnote.textContent = 'Could not reach the live wall, showing saved wishes instead.';
      }
    } else {
      gnote.textContent = 'Wishes are saved in this browser only.';
    }
    return readLocal().concat(seed);
  }
  async function renderEntries() {
    const items = await loadEntries();
    list.innerHTML = '';
    items.forEach((it) => {
      const li = document.createElement('li');
      const b = document.createElement('b');
      const s = document.createElement('span');
      b.textContent = String(it.name || 'Anonymous').slice(0, 20);
      s.textContent = String(it.message || '').slice(0, 100);
      li.append(b, s);
      list.appendChild(li);
    });
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim().slice(0, 20);
    const message = form.elements.message.value.trim().slice(0, 100);
    if (!name || !message) return;
    if (remote) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/guestbook`, {
          method: 'POST',
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ name, message })
        });
        if (!r.ok) throw new Error(String(r.status));
      } catch (err) {
        gnote.textContent = 'Oops, Pip could not save that wish. Try again!';
        return;
      }
    } else {
      const local = readLocal();
      local.unshift({ name, message });
      store.set('pip-guestbook', JSON.stringify(local.slice(0, 30)));
    }
    form.reset();
    sfx.giggle();
    await renderEntries();
    if (!remote) gnote.textContent = 'Thank you! Pip stuck your wish on the wall (saved in this browser).';
  });
  renderEntries();
})();
