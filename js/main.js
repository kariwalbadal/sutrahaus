/* Sutra Haus — interactions & motion system (v7) */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header state ---------- */
  var head = document.querySelector('.site-head');
  var progress = document.querySelector('.progress');
  var docH = 0;
  var measure = function () {
    docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  };
  measure();
  window.addEventListener('resize', measure);

  /* ---------- shared scroll loop ---------- */
  var rev = document.querySelector('.reveal');
  var plxEls = [];
  var marquees = [];
  var lastY = window.scrollY;
  var lastT = performance.now();

  var onScrollFrame = function () {
    var y = window.scrollY;
    head.classList.toggle('scrolled', y > 20);
    if (progress) progress.style.setProperty('--sp', (y / docH).toFixed(4));

    if (rev && !reduced) {
      var total = rev.offsetHeight - window.innerHeight;
      var p = total <= 0 ? 1 : (y - rev.offsetTop) / total;
      rev.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    }

    if (!reduced && window.innerWidth > 980) {
      var vh = window.innerHeight;
      plxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var c = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5-ish
        el.style.setProperty('--plx', (c * -34).toFixed(1) + 'px');
      });

      var now = performance.now();
      var dt = Math.max(16, now - lastT);
      var vel = (y - lastY) / dt; // px per ms
      var skew = Math.max(-3.2, Math.min(3.2, vel * 9));
      marquees.forEach(function (m) {
        m.style.setProperty('--skew', skew.toFixed(2) + 'deg');
      });
      lastY = y; lastT = now;
    }
  };
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { ticking = false; onScrollFrame(); });
    }
  }, { passive: true });

  /* ---------- nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open');
    });
  }

  /* ---------- split-line mask reveals ---------- */
  function splitLines(el) {
    if (reduced || el.dataset.split) return;
    el.dataset.split = '1';
    var parts = [];
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/\s+/).forEach(function (w) { if (w) parts.push({ t: w }); });
      } else if (n.nodeType === 1) {
        parts.push({ html: n.outerHTML });
      }
    });
    // group words into visual lines is overkill — mask per logical chunk:
    // split at <em>/<b> boundaries so accents animate as their own line.
    var chunks = [];
    var cur = [];
    parts.forEach(function (p) {
      if (p.html) {
        if (cur.length) { chunks.push(cur.join(' ')); cur = []; }
        chunks.push(p.html);
      } else {
        cur.push(p.t);
      }
    });
    if (cur.length) chunks.push(cur.join(' '));
    el.innerHTML = chunks.map(function (c) {
      return '<span class="ln"><span>' + c + '</span></span>';
    }).join(' ');
  }
  document.querySelectorAll('.vhero h1, .phero h1, .rv-state h2').forEach(splitLines);

  /* ---------- entrance ---------- */
  window.addEventListener('load', function () {
    requestAnimationFrame(function () { document.body.classList.add('loaded'); });
  });
  // safety: if load already fired or hangs
  setTimeout(function () { document.body.classList.add('loaded'); }, 1400);

  /* ---------- reveal-on-scroll + heading masks + counters ---------- */
  var revealed = document.querySelectorAll('[data-reveal]');
  var lnHeads = document.querySelectorAll('.phero h1');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('.ln').forEach(function (l) { l.classList.add('in'); });
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    revealed.forEach(function (el) { io.observe(el); });
    lnHeads.forEach(function (el) { io.observe(el); });

    // reels container: stagger tiles
    document.querySelectorAll('.reels').forEach(function (r) {
      new IntersectionObserver(function (es, obs) {
        es.forEach(function (en) {
          if (en.isIntersecting) { r.classList.add('in'); obs.disconnect(); }
        });
      }, { threshold: 0.12 }).observe(r);
    });

    // stats count-up
    document.querySelectorAll('.stat b').forEach(function (b) {
      var m = (b.childNodes[0] && b.childNodes[0].nodeType === 3) ? b.childNodes[0].textContent.trim() : null;
      if (!m || !/^\d+$/.test(m) || reduced) return;
      var target = parseInt(m, 10);
      new IntersectionObserver(function (es, obs) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          obs.disconnect();
          var start = performance.now(), dur = 1400;
          var tick = function (now) {
            var t = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            b.childNodes[0].textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 }).observe(b);
    });
  } else {
    revealed.forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.reels').forEach(function (r) { r.classList.add('in'); });
  }

  /* ---------- parallax + skew targets ---------- */
  document.querySelectorAll('.pband, .door, .w-media .primary').forEach(function (el) {
    el.setAttribute('data-plx', '');
    plxEls.push(el);
  });
  marquees = Array.prototype.slice.call(document.querySelectorAll('.marquee'));

  /* ---------- reels: play while visible (max 5), tap for sound ---------- */
  var reels = document.querySelectorAll('.reel');
  var playing = [];
  function playCapped(v) {
    if (playing.indexOf(v) !== -1) return;
    playing.push(v);
    while (playing.length > 5) {
      var old = playing.shift();
      if (old !== v) old.pause();
    }
    v.play().catch(function () {});
  }
  if (reels.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target.querySelector('video');
        if (!v) return;
        if (en.isIntersecting) { playCapped(v); }
        else {
          v.pause();
          var i = playing.indexOf(v);
          if (i !== -1) playing.splice(i, 1);
        }
      });
    }, { threshold: 0.25 });
    reels.forEach(function (r) { vio.observe(r); });
  } else {
    reels.forEach(function (r) {
      var v = r.querySelector('video');
      if (v) v.play().catch(function () {});
    });
  }
  reels.forEach(function (r) {
    var btn = r.querySelector('.snd');
    var v = r.querySelector('video');
    if (!btn || !v) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      v.muted = !v.muted;
      btn.textContent = v.muted ? '♪' : '✕';
      if (!v.muted) {
        document.querySelectorAll('.reel video').forEach(function (o) {
          if (o !== v) o.muted = true;
        });
        document.querySelectorAll('.reel .snd').forEach(function (o) {
          if (o !== btn) o.textContent = '♪';
        });
      }
    });
  });

  /* ---------- language banner ---------- */
  var banner = document.querySelector('.lang-banner');
  if (banner) {
    var dismissed = false;
    try { dismissed = localStorage.getItem('sh-lang-dismissed') === '1'; } catch (e) {}
    var lang = ((navigator.language || '').slice(0, 2) || '').toLowerCase();
    var href = banner.getAttribute('data-' + lang);
    var label = banner.getAttribute('data-' + lang + '-label');
    if (!dismissed && href && label) {
      banner.querySelector('.lb-slot').innerHTML = '<a href="' + href + '">' + label + ' →</a>';
      banner.classList.add('show');
      banner.querySelector('.lb-close').addEventListener('click', function () {
        banner.classList.remove('show');
        try { localStorage.setItem('sh-lang-dismissed', '1'); } catch (e) {}
      });
    }
  }

  onScrollFrame();
})();
