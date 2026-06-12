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

  /* ---- Demo contact form ---- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      if (status) {
        status.textContent =
          "Jazākum Allāhu khayran — your message has been noted. We will be in touch, in shā’ Allah.";
      }
      form.reset();
    });
  }
})();
