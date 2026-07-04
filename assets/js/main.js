/* ============================================================
   IKRAM — main.js
   Non-animation behaviour: mobile menu, demo links, demo form.
   Every block checks its elements exist, so this file is safe
   to include on any page.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Mobile menu (burger) ---- */
  var burger = document.querySelector(".burger");
  var links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Placeholder links (data-demo) ---- */
  document.querySelectorAll("[data-demo]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var prev = a.getAttribute("data-demo-label");
      if (prev) return; // already showing
      var label = a.querySelector("h4") || a;
      a.setAttribute("data-demo-label", "1");
      var note = document.createElement("span");
      note.textContent = " · coming soon, in shā’ Allah";
      note.style.cssText = "font-size:.72em;color:var(--brass);font-style:italic;";
      label.appendChild(note);
      setTimeout(function () {
        note.remove();
        a.removeAttribute("data-demo-label");
      }, 2200);
    });
  });

  /* ---- Topic filter (articles.html, answers.html) ----
     Chips in .filter-row show/hide any [data-cat] items on the page.
     Deep-linkable: ?topic=<slug> applies the matching chip on load. */
  var filterRow = document.querySelector(".filter-row");
  if (filterRow) {
    var chips = filterRow.querySelectorAll("[data-filter]");
    var items = document.querySelectorAll("[data-cat]");
    var empty = document.querySelector(".filter-empty");
    var applyFilter = function (chip) {
      var cat = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("btn-primary", on);
        c.classList.toggle("btn-ghost", !on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var shown = 0;
      items.forEach(function (it) {
        var show = cat === "all" || it.getAttribute("data-cat") === cat;
        it.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (empty) empty.hidden = shown > 0;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { applyFilter(chip); });
    });
    var wanted = new URLSearchParams(window.location.search).get("topic");
    if (wanted) {
      chips.forEach(function (c) {
        if (c.getAttribute("data-filter") === wanted) applyFilter(c);
      });
    }
  }

  /* ---- Contact page: preselect topic from ?topic= ---- */
  var topicSelect = document.getElementById("topic");
  if (topicSelect) {
    var t = new URLSearchParams(window.location.search).get("topic");
    if (t) {
      var map = {
        question: "Ask a question",
        volunteer: "Volunteer with IKRAM",
        support: "Support our work",
        program: "Join a program"
      };
      var label = map[t.toLowerCase()];
      if (label) topicSelect.value = label;
    }
  }

  /* ---- Contact form → opens the visitor's email app, pre-filled ----
     A static site has no backend; mailto keeps the form honest and
     working everywhere. Swap for a Formspree/API endpoint later if wanted. */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = function (name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : "";
      };
      var topic = val("topic") || "Message";
      var subject = "[ikrammaldives.org] " + topic + " — " + val("name");
      var body = val("message") + "\n\n— " + val("name") + " · " + val("email");
      window.location.href =
        "mailto:info@ikrammaldives.org" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
      var status = form.querySelector(".form-status");
      if (status) {
        status.textContent =
          "Jazākum Allāhu khayran — your email app should open with the message ready to send.";
      }
    });
  }
})();
