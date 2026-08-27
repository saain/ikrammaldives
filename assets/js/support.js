/* ============================================================
   IKRAM — support.js
   Copy-to-clipboard for the bank account numbers on support.html.
   Safe to include anywhere: does nothing if no .copy-btn exists.
   ============================================================ */
(function () {
  "use strict";

  var buttons = document.querySelectorAll(".copy-btn[data-copy]");
  if (!buttons.length) return;

  /* Older browsers / non-secure contexts: copy via a hidden textarea */
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /* Last resort: highlight the number so the person can copy it by hand */
  function selectNumber(btn) {
    var num = btn.parentNode && btn.parentNode.querySelector("span[id]");
    if (!num || !window.getSelection) return;
    var range = document.createRange();
    range.selectNodeContents(num);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  buttons.forEach(function (btn) {
    var label = btn.querySelector(".copy-label") || btn;
    var original = label.textContent;
    var timer = null;

    function finish(ok) {
      clearTimeout(timer);
      btn.classList.toggle("copied", ok);
      label.textContent = ok ? "Copied" : "Select & copy";
      if (!ok) selectNumber(btn);
      timer = setTimeout(function () {
        btn.classList.remove("copied");
        label.textContent = original;
      }, 2000);
    }

    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { finish(true); },
          function () { finish(legacyCopy(text)); }
        );
      } else {
        finish(legacyCopy(text));
      }
    });
  });
})();
