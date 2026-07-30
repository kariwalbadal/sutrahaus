/* Sutra Haus — interactions */
(function () {
  var head = document.querySelector('.site-head');
  var onScroll = function () {
    head.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  var revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('in'); });
  }

  // reels: play while visible, pause offscreen; tap toggles sound on ad tiles
  var reels = document.querySelectorAll('.reel');
  if (reels.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target.querySelector('video');
        if (!v) return;
        if (en.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
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

  // scroll reveal: drive --p from scroll progress through the section
  var rev = document.querySelector('.reveal');
  if (rev && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ticking = false;
    var driveReveal = function () {
      ticking = false;
      var total = rev.offsetHeight - window.innerHeight;
      if (total <= 0) { rev.style.setProperty('--p', 1); return; }
      var p = (window.scrollY - rev.offsetTop) / total;
      rev.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(driveReveal); }
    }, { passive: true });
    driveReveal();
  } else if (rev) {
    rev.style.setProperty('--p', 1);
  }

  // suggest a translated page on English pages, once
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
})();
