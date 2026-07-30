/* Sutra Haus — interactions */
(function () {
  // header state
  var head = document.querySelector('.site-head');
  var onScroll = function () {
    head.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile nav
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

  // reveal on scroll
  var revealed = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add('in'); });
  }

  // before/after slider
  document.querySelectorAll('.ba').forEach(function (ba) {
    var setCut = function (clientX) {
      var r = ba.getBoundingClientRect();
      var pct = Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100));
      ba.style.setProperty('--cut', pct + '%');
    };
    var dragging = false;
    ba.addEventListener('pointerdown', function (e) {
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      setCut(e.clientX);
    });
    ba.addEventListener('pointermove', function (e) {
      if (dragging) setCut(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      ba.addEventListener(ev, function () { dragging = false; });
    });
    // gentle intro nudge
    var nudged = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !nudged) {
            nudged = true;
            ba.animate(
              [{ '--cut': '50%' }, { '--cut': '42%' }, { '--cut': '58%' }, { '--cut': '50%' }],
              { duration: 1800, easing: 'ease-in-out' }
            );
            obs.disconnect();
          }
        });
      }, { threshold: 0.5 }).observe(ba);
    }
  });
})();
