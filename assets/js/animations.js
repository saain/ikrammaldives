/* ============================================================
   IKRAM — animations.js  (shared across every page)
   GSAP 3 + ScrollTrigger, loaded from cdnjs.

   Design rules
   ------------
   • Nothing is hidden in CSS. All initial "hidden" states are set
     by GSAP, so if this file (or the CDN) fails, every element is
     simply visible and the site works normally.
   • Everything is wrapped in gsap.matchMedia(): users with
     prefers-reduced-motion get no movement — content stays visible
     and the header still gets its translucent class toggle.
   • Every setup function checks that its elements exist, so this
     one file is safe to include on every page.
   • Tone: slow, graceful, understated. power2/power3.out,
     durations 0.8–1.2s, no bounce.

   Markup hooks
   ------------
   .reveal            fade + rise in on scroll (optional .d1–.d4 = extra delay)
   [data-stagger]     children cascade in with stagger 0.12
   [data-hero]        hero container — entrance timeline on page load,
                      plus a scrubbed drift as the hero scrolls away
   [data-parallax=N]  drifts ~1.7×N px slower than the page (scrubbed)
   [data-scrub-scale] scales 1.18 → 1 tied to scroll position
   [data-draw]        SVG stroke draws itself as you scroll (scrubbed)
   .dark.verse .ar    Arabic verse fades in word by word, tied to scroll
   [data-pin]         on a verse band: pins while the words fill in
   Lenis (jsdelivr CDN) provides inertial smooth scrolling when present.
   ============================================================ */
(function () {
  "use strict";

  /* Fail gracefully if the CDN didn't load. */
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  var EASE = "power3.out";

  function $all(sel, ctx) {
    return gsap.utils.toArray((ctx || document).querySelectorAll(sel));
  }

  /* .d1–.d4 classes (already in the markup) → extra delay, 0.12s steps */
  function delayFor(el) {
    for (var i = 1; i <= 4; i++) {
      if (el.classList.contains("d" + i)) return i * 0.12;
    }
    return 0;
  }

  /* ---------- manual line split (SplitText-style, no plugin) ---------- */
  function splitLines(el) {
    /* already split (e.g. after a matchMedia re-run) — reuse */
    var existing = el.querySelectorAll(".split-line-inner");
    if (existing.length) {
      return {
        inners: Array.prototype.slice.call(existing),
        outers: Array.prototype.slice.call(el.querySelectorAll(".split-line"))
      };
    }
    var nodes = Array.prototype.slice.call(el.childNodes);
    var groups = [[]];
    nodes.forEach(function (n) {
      if (n.nodeName === "BR") {
        groups.push([]);
        el.removeChild(n);
      } else {
        groups[groups.length - 1].push(n);
      }
    });
    var inners = [], outers = [];
    groups.forEach(function (group) {
      if (!group.length) return;
      var outer = document.createElement("span");
      outer.className = "split-line";
      outer.style.display = "block";
      outer.style.overflow = "hidden";
      var inner = document.createElement("span");
      inner.className = "split-line-inner";
      inner.style.display = "block";
      group.forEach(function (n) { inner.appendChild(n); });
      outer.appendChild(inner);
      el.appendChild(outer);
      inners.push(inner);
      outers.push(outer);
    });
    return { inners: inners, outers: outers };
  }

  /* ============================================================
     0 · LENIS — inertial "flowing" scroll, wired into ScrollTrigger
         (skipped entirely for reduced motion or if the CDN failed)
     ============================================================ */
  function initLenis(addCleanup) {
    if (!window.Lenis) return;
    var lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    lenis.on("scroll", ScrollTrigger.update);
    var raf = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    /* native smooth scrolling would double-smooth — Lenis owns it now */
    document.documentElement.style.scrollBehavior = "auto";

    /* same-page anchors glide through Lenis (header offset accounted) */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var handler = function (e) {
        var id = a.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -84 });
        }
      };
      a.addEventListener("click", handler);
      addCleanup(function () { a.removeEventListener("click", handler); });
    });

    addCleanup(function () {
      gsap.ticker.remove(raf);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = "";
    });
  }

  /* ============================================================
     1 · HEADER — translucent blur + shrink after leaving the hero
         (class toggle works even with reduced motion;
          the padding tween only runs when motion is allowed)
     ============================================================ */
  function setupHeader(motionOK) {
    var header =
      document.querySelector(".site-header") ||
      document.querySelector("header.nav");
    if (!header) return;

    var isMulti = header.classList.contains("site-header");
    var cls = isMulti ? "is-scrolled" : "solid";
    var inner = header.querySelector(isMulti ? ".nav" : ".nav-inner");

    var shrink = null;
    if (motionOK && inner) {
      shrink = gsap.timeline({ paused: true }).to(inner, {
        paddingTop: isMulti ? "0.85rem" : "0.95rem",
        paddingBottom: isMulti ? "0.85rem" : "0.95rem",
        duration: 0.45,
        ease: "power2.out"
      });
    }

    ScrollTrigger.create({
      start: 90,
      end: "max",
      onEnter: function () {
        header.classList.add(cls);
        if (shrink) shrink.play();
      },
      onLeaveBack: function () {
        header.classList.remove(cls);
        if (shrink) shrink.reverse();
      }
    });
  }

  /* ============================================================
     2 · HERO entrance timeline (page load)
         title lines → supporting copy → CTAs → stats,
         Arabic / decorative elements last.
     ============================================================ */
  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;

    var title = hero.querySelector("h1");
    var split = title ? splitLines(title) : { inners: [], outers: [] };

    var eyebrow = $all(".eyebrow", hero);
    var subs    = $all(".hero-sub", hero);
    var ledes   = $all(".lede, p.lead", hero);
    var actions = $all(".hero-actions", hero);
    var meta    = $all(".hero-meta > div", hero);
    if (!meta.length) meta = $all(".hero-meta", hero);
    var late    = $all(".bismillah, .hero-arab, .hero-arch, .float-badge, .hero-glow", hero);

    var tl = gsap.timeline({
      delay: 0.15,
      defaults: { ease: EASE },
      onComplete: function () {
        /* free line clipping so descenders are never cut afterwards */
        if (split.outers.length) gsap.set(split.outers, { overflow: "visible" });
      }
    });

    if (split.inners.length) {
      tl.from(split.inners, { yPercent: 115, duration: 1.05, stagger: 0.14 }, 0.05);
    }
    if (eyebrow.length) tl.from(eyebrow, { y: 24, autoAlpha: 0, duration: 0.9 }, 0);
    if (subs.length)    tl.from(subs,    { y: 30, autoAlpha: 0, duration: 0.95 }, 0.55);
    if (ledes.length)   tl.from(ledes,   { y: 30, autoAlpha: 0, duration: 0.95 }, 0.7);
    if (actions.length) tl.from(actions, { y: 26, autoAlpha: 0, duration: 0.9 }, 0.9);
    if (meta.length)    tl.from(meta,    { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 1.05);
    if (late.length)    tl.from(late,    { y: 18, autoAlpha: 0, duration: 1.2, stagger: 0.18 }, 1.2);
  }

  /* ============================================================
     2b · HERO SCROLL DRIFT — as you scroll past the hero, the copy
          rises away and the arch drifts with depth (scrubbed)
     ============================================================ */
  function setupHeroScrub() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;
    var copy = hero.querySelector(".hero-copy") || hero.querySelector(".wrap");
    var arch = hero.querySelector(".hero-arch");
    if (copy) {
      gsap.to(copy, {
        yPercent: -12, autoAlpha: 0.3, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    }
    if (arch) {
      gsap.to(arch, {
        y: -80, scale: 1.05, ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ============================================================
     2c · AMBIENT — the lamp sways and the badge floats, gently
     ============================================================ */
  function setupAmbient() {
    var lamp = document.querySelector(".lamp");
    if (lamp) {
      gsap.to(lamp, { y: 7, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.4 });
    }
    var badge = document.querySelector(".float-badge");
    if (badge) {
      gsap.to(badge, { y: -6, duration: 3.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 3 });
    }
  }

  /* ============================================================
     2d · SCROLL PROGRESS — brass hairline under the header
     ============================================================ */
  function setupProgress() {
    if (document.querySelector(".scroll-progress")) return;
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) { gsap.set(bar, { scaleX: self.progress }); }
    });
  }

  /* ============================================================
     3 · SCROLL REVEALS — every .reveal fades + rises in
         (hero children, [data-stagger] children and word-scrubbed
          verses are excluded: their own handlers own them)
     ============================================================ */
  function setupReveals() {
    var els = $all(".reveal").filter(function (el) {
      return !el.closest("[data-hero]") &&
             !el.closest("[data-stagger]") &&
             !el.hasAttribute("data-skip-reveal");
    });
    els.forEach(function (el) {
      var from = { y: 64, autoAlpha: 0 };
      var to = {
        y: 0, autoAlpha: 1,
        duration: 1.15, ease: EASE,
        delay: delayFor(el),
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      };
      /* headings get a soft focus-pull as they rise — modern, not flashy */
      if (el.matches(".section-head, .page-hero h1, h2.reveal, .prose")) {
        from.filter = "blur(8px)";
        to.filter = "blur(0px)";
        to.clearProps = "filter";
      }
      gsap.fromTo(el, from, to);
    });
  }

  /* ============================================================
     3b · VERSE BANDS — the āyah fills in word by word, tied
          directly to scroll; with [data-pin] the band holds in
          place while the words complete (index page showpiece)
     ============================================================ */
  function setupVerseScrub() {
    $all(".dark.verse").forEach(function (band) {
      var ar = band.querySelector(".ar");
      if (!ar || ar.querySelector(".w")) return;
      ar.setAttribute("data-skip-reveal", "");
      var words = ar.textContent.trim().split(/\s+/);
      ar.textContent = "";
      var spans = words.map(function (w, i) {
        var s = document.createElement("span");
        s.className = "w";
        s.textContent = w;
        ar.appendChild(s);
        if (i < words.length - 1) ar.appendChild(document.createTextNode(" "));
        return s;
      });
      if (!spans.length) return;
      var pinned = band.hasAttribute("data-pin");
      gsap.set(spans, { opacity: 0.12 });
      gsap.to(spans, {
        opacity: 1,
        ease: "none",
        stagger: 0.3,
        scrollTrigger: {
          trigger: band,
          start: pinned ? "top top" : "top 78%",
          end: pinned ? "+=110%" : "center 42%",
          scrub: true,
          pin: pinned,
          anticipatePin: pinned ? 1 : 0
        }
      });
    });
  }

  /* ============================================================
     4 · STAGGERED GROUPS — card grids & lists cascade in
     ============================================================ */
  function setupStaggers() {
    $all("[data-stagger]").forEach(function (group) {
      var items = gsap.utils.toArray(group.children);
      if (!items.length) return;
      gsap.fromTo(items,
        { y: 56, autoAlpha: 0 },
        {
          y: 0, autoAlpha: 1,
          duration: 1.05, ease: EASE, stagger: 0.12,
          scrollTrigger: { trigger: group, start: "top 86%", once: true }
        });
    });
  }

  /* ============================================================
     5 · PARALLAX — backgrounds drift slower than the page
     ============================================================ */
  function setupParallax() {
    $all("[data-parallax]").forEach(function (el) {
      var dist = (parseFloat(el.getAttribute("data-parallax")) || 60) * 1.7;
      var container = el.closest("section") || el.parentElement || el;
      gsap.fromTo(el,
        { y: -dist / 2 },
        {
          y: dist / 2,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
    });
  }

  /* ============================================================
     6 · SCROLL-SCRUBBED SCALE — settles 1.12 → 1 as you scroll
     ============================================================ */
  function setupScrubScale() {
    $all("[data-scrub-scale]").forEach(function (el) {
      var from = parseFloat(el.getAttribute("data-scrub-scale")) || 1.18;
      gsap.fromTo(el,
        { scale: from, transformOrigin: "50% 50%" },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") || el,
            start: "top 85%",
            end: "center 38%",
            scrub: true
          }
        });
    });
  }

  /* ============================================================
     7 · SELF-DRAWING ORNAMENT — SVG strokes draw with scroll
     ============================================================ */
  function setupDraw() {
    $all("svg[data-draw], .flourish svg").forEach(function (svg) {
      var strokes = $all("[data-draw], path, circle, line, polyline", svg)
        .filter(function (p) { return p.tagName.toLowerCase() !== "svg"; });
      var drawable = [];
      strokes.forEach(function (p) {
        try {
          var len = p.getTotalLength();
          if (len > 0) {
            gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
            drawable.push(p);
          }
        } catch (e) { /* element can't report a length — skip it */ }
      });
      if (!drawable.length) return;
      gsap.to(drawable, {
        strokeDashoffset: 0,
        ease: "none",
        stagger: 0.08,
        scrollTrigger: {
          trigger: svg,
          start: "top 94%",
          end: "top 45%",
          scrub: true
        }
      });
    });
  }

  /* ============================================================
     8 · MICRO-INTERACTIONS — gentle lift on cards
         (buttons & nav links use plain CSS transitions)
     ============================================================ */
  function setupHoverLift(addCleanup) {
    var targets = $all(
      ".card, .pillar, .res-item, .video, .value, .event, .res-card, .prog"
    );
    targets.forEach(function (el) {
      var enter = function () {
        gsap.to(el, {
          y: -6,
          boxShadow: "0 22px 48px rgba(19,50,43,.13)",
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto" /* if hovered mid-reveal, take over y cleanly */
        });
      };
      var leave = function () {
        gsap.to(el, {
          y: 0,
          boxShadow: "0 0 0 rgba(19,50,43,0)",
          duration: 0.6,
          ease: "power2.out"
        });
      };
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      addCleanup(function () {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    });
  }

  /* ============================================================
     BOOT — gsap.matchMedia handles prefers-reduced-motion
     ============================================================ */
  function boot() {
    var mm = gsap.matchMedia();

    mm.add(
      {
        motionOK: "(prefers-reduced-motion: no-preference)",
        reduced:  "(prefers-reduced-motion: reduce)",
        canHover: "(hover: hover) and (pointer: fine)"
      },
      function (ctx) {
        var motionOK = ctx.conditions.motionOK;
        var canHover = ctx.conditions.canHover;
        var cleanups = [];
        var addCleanup = function (fn) { cleanups.push(fn); };

        var safe = function (fn) {
          try { fn(); } catch (e) {
            if (window.console) console.warn("IKRAM animations:", e);
          }
        };

        /* header class toggle runs in both modes (it's a style change,
           not motion); the shrink tween only when motion is allowed */
        safe(function () { setupHeader(motionOK); });

        if (motionOK) {
          safe(function () { initLenis(addCleanup); });
          safe(setupProgress);
          safe(setupVerseScrub); /* before reveals: flags verses to skip */
          safe(setupHero);
          safe(setupHeroScrub);
          safe(setupAmbient);
          safe(setupReveals);
          safe(setupStaggers);
          safe(setupParallax);
          safe(setupScrubScale);
          safe(setupDraw);
          if (canHover) safe(function () { setupHoverLift(addCleanup); });
        }
        /* reduced motion: nothing was hidden, so there is nothing to show */

        return function () {
          cleanups.forEach(function (fn) { fn(); });
        };
      }
    );

    /* layout settles after web fonts load — recalculate trigger points */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
