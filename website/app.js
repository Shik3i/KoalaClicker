/* =====================================================
   KoalaClicker — app.js
   Scroll reveals, hamburger menu, smooth scroll, nav
   ===================================================== */

(function () {
  'use strict';

  /* ── Scroll Reveal ─────────────────────────────────── */
  function initScrollReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Stagger cards in grids
            const delay = entry.target.closest('.features-grid')
              ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 80
              : 0;
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ── Nav Scroll Behavior ───────────────────────────── */
  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 20) {
            nav.classList.add('scrolled');
          } else {
            nav.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }

  /* ── Hamburger Menu ────────────────────────────────── */
  function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (!hamburger || !navLinks) return;

    function toggleMenu(open) {
      const isOpen = open !== undefined ? open : hamburger.getAttribute('aria-expanded') !== 'true';
      hamburger.setAttribute('aria-expanded', String(isOpen));
      navLinks.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    hamburger.addEventListener('click', () => toggleMenu());

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        hamburger.getAttribute('aria-expanded') === 'true' &&
        !hamburger.contains(e.target) &&
        !navLinks.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
        toggleMenu(false);
        hamburger.focus();
      }
    });

    // Close menu on resize to desktop
    window.addEventListener(
      'resize',
      debounce(() => {
        if (window.innerWidth > 768) {
          toggleMenu(false);
        }
      }, 150)
    );
  }

  /* ── Smooth Scroll for anchor links ────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ── Email Reveal (for impressum/datenschutz) ──────── */
  function initEmailReveal() {
    document.querySelectorAll('.email-reveal').forEach((el) => {
      el.addEventListener('click', function () {
        if (this.dataset.revealed === 'true') return;
        const user = this.dataset.user;
        const domain = this.dataset.domain;
        if (user && domain) {
          this.textContent = user + '@' + domain;
          this.dataset.revealed = 'true';
          this.setAttribute('href', 'mailto:' + user + '@' + domain);
        }
      });
    });
  }

  /* ── Popup mockup: subtle idle animation ───────────── */
  function initMockupAnimation() {
    const runningCard = document.querySelector('.pm-card-running');
    if (!runningCard) return;

    // Simulate clicks/sec counter animation
    const badge = runningCard.querySelector('.pm-badge-running');
    if (!badge) return;

    let frame = 0;
    const states = ['Running', 'Running ·', 'Running ··', 'Running ···'];

    setInterval(() => {
      frame = (frame + 1) % states.length;
      badge.textContent = states[frame];
    }, 600);
  }

  /* ── Active nav link highlight ─────────────────────── */
  function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              const isActive = link.getAttribute('href') === `#${id}`;
              link.style.color = isActive ? 'var(--accent)' : '';
            });
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px',
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ── Utility: debounce ─────────────────────────────── */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* ── Init ──────────────────────────────────────────── */
  function init() {
    initNavScroll();
    initScrollReveal();
    initHamburger();
    initSmoothScroll();
    initEmailReveal();
    initMockupAnimation();
    initActiveNavLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
