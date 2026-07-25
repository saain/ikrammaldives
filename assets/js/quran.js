/* ============================================================
   IKRAM — quran.js · Qur'ān listening page (v2)
   Data: Al Quran Cloud (api.alquran.cloud, keyless, CORS-open)
   Audio:
     · read-along mode — per-āyah mp3 URLs returned by the API
       (each āyah is its own track → highlight + auto-scroll)
     · continuous mode — full-surah mp3 from cdn.islamic.network
   Tafsīr: Ibn Kathīr (En, abridged) via CDN dataset; al-Muyassar
   (Ar) via Al Quran Cloud; deep links to Altafsir.com.
   State (surah/āyah/reciter/mode/position) in localStorage.
   Scroll containers use data-lenis-prevent so the site's smooth
   scrolling does not swallow wheel events inside them.
   ============================================================ */
(function () {
  "use strict";

  var listEl = document.getElementById("q-list");
  if (!listEl) return; // not on this page

  var API = "https://api.alquran.cloud/v1";
  var AUDIO_SURAH = "https://cdn.islamic.network/quran/audio-surah/128/";
  /* spa5k/tafsir_api dataset · files live at {slug}/{surah}/{ayah}.json */
  var TAFSIR_CDN = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/";
  var TAFSIR_EDS = {
    ibnkathir: { slug: "en-tafisr-ibn-kathir", ar: false, name: "Tafsīr Ibn Kathīr (abridged)" },
    muyassar: { slug: "ar-tafsir-muyassar", ar: true, name: "تفسير الميسّر" }
  };
  var STORE = "ikram-quran";

  var readerEl = document.getElementById("q-reader");
  var searchEl = document.getElementById("q-search");
  var reciterEl = document.getElementById("q-reciter");
  var transEl = document.getElementById("q-trans");
  var tafsirEl = document.getElementById("q-tafsir");
  var modeEl = document.getElementById("q-mode");
  var resumeEl = document.getElementById("q-resume");
  var player = document.getElementById("q-player");
  var audio = document.getElementById("q-audio");
  var playBtn = document.getElementById("q-play");
  var icPlay = document.getElementById("q-ic-play");
  var icPause = document.getElementById("q-ic-pause");
  var nowName = document.getElementById("q-now-name");
  var nowSub = document.getElementById("q-now-sub");
  var curEl = document.getElementById("q-cur");
  var durEl = document.getElementById("q-dur");
  var barEl = document.getElementById("q-bar");
  var fillEl = document.getElementById("q-fill");
  var prevBtn = document.getElementById("q-prev");
  var nextBtn = document.getElementById("q-next");

  var surahs = [];
  var current = null;        // surah meta
  var tracks = [];           // read-along: per-āyah audio URLs
  var blocks = [];           // read-along: per-āyah DOM nodes
  var idx = -1;              // read-along: current āyah index (0-based)
  var pendingSeek = null;    // continuous mode resume
  var prefetch = new Audio();// warms the cache for the next āyah

  /* ---------- helpers ---------- */
  function save(patch) {
    var s = load();
    Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function fmt(t) {
    if (!isFinite(t)) return "0:00";
    t = Math.max(0, Math.round(t));
    var m = Math.floor(t / 60), s = t % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function isAyahMode() { return modeEl.value === "ayah"; }

  /* scroll the reader (or the page, on small screens) to a block */
  function follow(block) {
    if (!block) return;
    var scrollable = readerEl.scrollHeight > readerEl.clientHeight + 8;
    if (scrollable) {
      readerEl.scrollTo({
        top: block.offsetTop - readerEl.clientHeight / 2 + block.offsetHeight / 2,
        behavior: "smooth"
      });
    } else {
      block.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /* ---------- surah list ---------- */
  function renderList(filter) {
    listEl.innerHTML = "";
    var f = (filter || "").trim().toLowerCase();
    var shown = 0;
    surahs.forEach(function (s) {
      var hay = (s.number + " " + s.englishName + " " + s.englishNameTranslation + " " + s.name).toLowerCase();
      if (f && hay.indexOf(f) === -1) return;
      shown++;
      var row = el("button", "q-row" + (current && current.number === s.number ? " is-active" : ""));
      row.type = "button";
      row.setAttribute("role", "option");
      row.innerHTML =
        '<span class="q-num">' + s.number + "</span>" +
        '<span class="q-names"><strong>' + s.englishName + "</strong><span>" +
        s.englishNameTranslation + " · " + s.numberOfAyahs + " āyāt</span></span>" +
        '<span class="q-ar" lang="ar" dir="rtl">' + s.name.replace(/^سُورَةُ\s*/, "") + "</span>";
      row.addEventListener("click", function () {
        openSurah(s.number, { autoplay: true });
      });
      listEl.appendChild(row);
    });
    if (!shown) listEl.appendChild(el("p", "q-status", "No sūrah matches that search."));
  }

  /* ---------- reader + playback ---------- */
  function openSurah(n, opts) {
    opts = opts || {};
    var s = surahs[n - 1];
    if (!s) return;
    current = s;
    tracks = []; blocks = []; idx = -1;
    renderList(searchEl.value);
    readerEl.innerHTML = "";
    readerEl.appendChild(el("p", "q-status", "Loading Sūrah " + s.englishName + "…"));

    var wantTrans = transEl.value !== "none";
    var reqs = [getJSON(API + "/surah/" + n + "/quran-uthmani")];
    reqs.push(isAyahMode() ? getJSON(API + "/surah/" + n + "/" + reciterEl.value) : Promise.resolve(null));
    if (wantTrans) reqs.push(getJSON(API + "/surah/" + n + "/" + transEl.value));

    Promise.all(reqs).then(function (res) {
      var ar = res[0].data.ayahs;
      var au = res[1] ? res[1].data.ayahs : null;
      var tr = wantTrans && res[2] ? res[2].data.ayahs : null;
      if (au) tracks = au.map(function (a) { return a.audio; });

      readerEl.innerHTML = "";
      readerEl.appendChild(el("h2", null, s.englishName + ' <span class="q-ar" lang="ar" dir="rtl" style="font-size:1.4rem">' + s.name + "</span>"));
      readerEl.appendChild(el("p", "q-sub", s.englishNameTranslation + " · " + s.revelationType + " · " + s.numberOfAyahs + " āyāt"));
      var mk = el("button", "q-tafbtn q-mark", khDone(n) ? "✓ Completed — tap to unmark" : "Mark sūrah as completed");
      mk.type = "button";
      mk.addEventListener("click", function () {
        khToggle(n);
        mk.innerHTML = khDone(n) ? "✓ Completed — tap to unmark" : "Mark sūrah as completed";
      });
      readerEl.appendChild(mk);
      if (n !== 1 && n !== 9) {
        var bs = el("p", "q-bismillah");
        bs.innerHTML = '<img src="assets/img/basmala-maroon.png" alt="بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ" width="900" height="451" loading="lazy" />';
        readerEl.appendChild(bs);
      }
      ar.forEach(function (a, i) {
        var text = a.text;
        if (i === 0 && n !== 1 && n !== 9) {
          text = text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s*/, "");
        }
        var block = el("div", "q-ayah" + (tracks.length ? " is-clickable" : ""));
        block.innerHTML =
          '<span class="ar" lang="ar" dir="rtl">' + text +
          ' <span class="marker">' + s.number + ":" + a.numberInSurah + "</span></span>" +
          (tr ? '<span class="tr"' + (transEl.value.indexOf("dv.") === 0 ? ' lang="dv" dir="rtl"' : "") + ">" + tr[i].text + "</span>" : "");
        if (tafsirEl.value !== "none") {
          var btn = el("button", "q-tafbtn", "Tafsīr");
          btn.type = "button";
          btn.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleTafsir(block, btn, s.number, a.numberInSurah);
          });
          block.appendChild(btn);
        }
        if (tracks.length) {
          block.addEventListener("click", function (e) {
            if (e.target.closest("a")) return;
            playAyah(i, true);
          });
        }
        blocks.push(block);
        readerEl.appendChild(block);
      });
      readerEl.scrollTop = 0;

      /* start playback once the text is on screen */
      if (isAyahMode() && tracks.length) {
        var start = Math.min(Math.max(opts.startAyah || 0, 0), tracks.length - 1);
        playAyah(start, !!opts.autoplay);
      }
    }).catch(function () {
      readerEl.innerHTML = "";
      readerEl.appendChild(el("p", "q-status",
        "The Qur'ān service could not be reached just now. Please check your connection and try again, in shā' Allah."));
    });

    /* continuous mode: one full-surah file */
    if (!isAyahMode()) {
      audio.src = AUDIO_SURAH + reciterEl.value + "/" + n + ".mp3";
      nowSub.textContent = reciterEl.options[reciterEl.selectedIndex].text;
      if (opts.seek) pendingSeek = opts.seek;
      if (opts.autoplay) audio.play().catch(function () {});
    }
    nowName.textContent = "Sūrah " + s.englishName;
    player.classList.add("on");
    document.body.classList.add("has-player");
    fillEl.style.width = "0";
    save({ surah: n, ayah: opts.startAyah || 0, mode: modeEl.value, reciter: reciterEl.value, trans: transEl.value, tafsir: tafsirEl.value, pos: opts.seek || 0 });
    if (resumeEl) resumeEl.hidden = true;
  }

  function playAyah(i, autoplay) {
    if (!current || !tracks[i]) return;
    if (idx >= 0 && blocks[idx]) blocks[idx].classList.remove("is-playing");
    idx = i;
    var block = blocks[i];
    if (block) { block.classList.add("is-playing"); follow(block); }
    audio.src = tracks[i];
    nowSub.textContent = reciterEl.options[reciterEl.selectedIndex].text + " · āyah " + (i + 1) + " / " + tracks.length;
    if (autoplay) audio.play().catch(function () {});
    if (tracks[i + 1]) { prefetch.src = tracks[i + 1]; prefetch.preload = "auto"; }
    save({ surah: current.number, ayah: i, mode: "ayah" });
  }

  /* ---------- tafsīr ---------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function toggleTafsir(block, btn, surah, ayah) {
    var existing = block.querySelector(".q-taf");
    if (existing) { existing.remove(); btn.textContent = "Tafsīr"; return; }
    var ed = TAFSIR_EDS[tafsirEl.value];
    if (!ed) return;
    btn.textContent = "Loading…";
    var fail = function () {
      btn.textContent = "Tafsīr";
      var t = el("div", "q-taf", "Tafsīr could not be loaded for this āyah right now.");
      block.appendChild(t);
      setTimeout(function () { t.remove(); }, 3500);
    };
    getJSON(TAFSIR_CDN + ed.slug + "/" + surah + "/" + ayah + ".json").then(function (j) {
      var text = (j && j.text) || "";
      if (!text.trim()) { fail(); return; }
      btn.textContent = "Hide tafsīr";
      var html = "<p>" + esc(text).trim()
        .replace(/\n{2,}/g, "</p><p>")
        .replace(/\n/g, "<br>") + "</p>";
      var more =
        ' · <a href="https://www.altafsir.com/Tafasir.asp?tMadhNo=0&amp;tTafsirNo=74&amp;tSoraNo=' +
        surah + "&amp;tAyahNo=" + ayah +
        '&amp;tDisplay=yes&amp;LanguageID=2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">More tafāsīr — Altafsir.com</a>';
      var t = el("div", "q-taf", html + '<span class="q-taf-src">' + ed.name + more + "</span>");
      if (ed.ar) { t.setAttribute("lang", "ar"); t.setAttribute("dir", "rtl"); }
      block.appendChild(t);
    }).catch(fail);
  }

  /* ---------- player wiring ---------- */
  playBtn.addEventListener("click", function () {
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  });
  prevBtn.addEventListener("click", function () {
    if (!current) return;
    if (isAyahMode()) {
      if (idx > 0) playAyah(idx - 1, true);
      else if (current.number > 1) openSurah(current.number - 1, { autoplay: true });
    } else if (current.number > 1) {
      openSurah(current.number - 1, { autoplay: true });
    }
  });
  nextBtn.addEventListener("click", function () {
    if (!current) return;
    if (isAyahMode()) {
      if (idx < tracks.length - 1) playAyah(idx + 1, true);
      else if (current.number < 114) openSurah(current.number + 1, { autoplay: true });
    } else if (current.number < 114) {
      openSurah(current.number + 1, { autoplay: true });
    }
  });
  audio.addEventListener("play", function () { icPlay.style.display = "none"; icPause.style.display = "block"; });
  audio.addEventListener("pause", function () { icPlay.style.display = "block"; icPause.style.display = "none"; });
  audio.addEventListener("loadedmetadata", function () {
    durEl.textContent = fmt(audio.duration);
    if (!isAyahMode() && pendingSeek && isFinite(audio.duration) && pendingSeek < audio.duration - 5) {
      audio.currentTime = pendingSeek;
    }
    pendingSeek = null;
  });
  var tick = 0;
  audio.addEventListener("timeupdate", function () {
    curEl.textContent = fmt(audio.currentTime);
    if (audio.duration) {
      var pct = (audio.currentTime / audio.duration) * 100;
      fillEl.style.width = pct + "%";
      barEl.setAttribute("aria-valuenow", Math.round(pct));
    }
    if (!isAyahMode() && ++tick % 8 === 0 && current) save({ pos: Math.floor(audio.currentTime) });
  });
  audio.addEventListener("ended", function () {
    if (isAyahMode()) {
      if (idx < tracks.length - 1) playAyah(idx + 1, true);
      else if (current) {
        khMark(current.number); /* finished the last āyah — khatmah progress */
        if (current.number < 114) openSurah(current.number + 1, { autoplay: true });
      }
    } else {
      save({ pos: 0 });
      if (current) {
        khMark(current.number);
        if (current.number < 114) openSurah(current.number + 1, { autoplay: true });
      }
    }
  });
  barEl.addEventListener("click", function (e) {
    if (!audio.duration) return;
    var r = barEl.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  /* ---------- control changes ---------- */
  searchEl.addEventListener("input", function () { renderList(searchEl.value); });
  reciterEl.addEventListener("change", function () {
    save({ reciter: reciterEl.value });
    if (!current) return;
    var wasPlaying = !audio.paused;
    if (isAyahMode()) openSurah(current.number, { autoplay: wasPlaying, startAyah: Math.max(idx, 0) });
    else openSurah(current.number, { autoplay: wasPlaying, seek: audio.currentTime });
  });
  transEl.addEventListener("change", function () {
    save({ trans: transEl.value });
    if (current) reload(false);
  });
  tafsirEl.addEventListener("change", function () {
    save({ tafsir: tafsirEl.value });
    if (current) reload(false);
  });
  modeEl.addEventListener("change", function () {
    save({ mode: modeEl.value });
    if (current) reload(true);
  });
  function reload(autoplay) {
    var wasPlaying = autoplay && !audio.paused;
    if (isAyahMode()) openSurah(current.number, { autoplay: wasPlaying, startAyah: Math.max(idx, 0) });
    else openSurah(current.number, { autoplay: wasPlaying, seek: 0 });
  }

  /* ---------- khatmah (reading/listening progress) ---------- */
  var KH_STORE = "ikram-khatmah";
  var khEl = document.getElementById("q-khatmah");
  function khLoad() {
    try { return JSON.parse(localStorage.getItem(KH_STORE)) || []; } catch (e) { return []; }
  }
  function khSave(a) { try { localStorage.setItem(KH_STORE, JSON.stringify(a)); } catch (e) {} }
  function khDone(n) { return khLoad().indexOf(n) !== -1; }
  function khMark(n) {
    var a = khLoad();
    if (a.indexOf(n) === -1) { a.push(n); khSave(a); }
    khRender();
  }
  function khToggle(n) {
    var a = khLoad(), i = a.indexOf(n);
    if (i === -1) a.push(n); else a.splice(i, 1);
    khSave(a); khRender();
  }
  function khRender() {
    if (!khEl) return;
    var done = khLoad().length;
    khEl.hidden = done === 0;
    document.getElementById("qk-label").textContent =
      "Khatmah: " + done + " / 114 sūrahs · " + Math.round((done / 114) * 100) + "%";
    document.getElementById("qk-fill").style.width = (done / 114) * 100 + "%";
  }
  var khResetBtn = document.getElementById("qk-reset");
  if (khResetBtn) khResetBtn.addEventListener("click", function () {
    if (window.confirm("Start a new khatmah? Your current progress will be cleared.")) {
      khSave([]); khRender();
    }
  });

  /* ---------- live radio (MP3Quran) — hidden unless reachable ---------- */
  var radioBox = document.getElementById("q-radio");
  var radioAudio = new Audio();
  if (radioBox) {
    var rSel = document.getElementById("q-radio-select");
    var rBtn = document.getElementById("q-radio-play");
    var rStop = function () {
      radioAudio.pause();
      radioAudio.removeAttribute("src");
      rBtn.textContent = "Listen";
    };
    fetch("https://www.mp3quran.net/api/v3/radios?language=eng")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var radios = (j && j.radios) || [];
        if (!radios.length) return;
        radios.forEach(function (st) {
          var o = document.createElement("option");
          o.value = st.url; o.textContent = st.name;
          rSel.appendChild(o);
        });
        radioBox.hidden = false;
        rBtn.addEventListener("click", function () {
          if (!radioAudio.paused) { rStop(); return; }
          audio.pause(); /* one sound at a time */
          radioAudio.src = rSel.value;
          radioAudio.play().then(function () { rBtn.textContent = "Stop"; }).catch(rStop);
        });
        rSel.addEventListener("change", function () {
          if (!radioAudio.paused) {
            radioAudio.src = rSel.value;
            radioAudio.play().catch(rStop);
          }
        });
      }).catch(function () { /* unreachable — stays hidden */ });
    audio.addEventListener("play", function () { if (!radioAudio.paused) rStop(); });
  }

  /* ---------- boot ---------- */
  var st = load();
  if (st.tafsir === "ar.muyassar") st.tafsir = "muyassar"; // migrate old value
  if (st.reciter) reciterEl.value = st.reciter;
  if (st.trans) transEl.value = st.trans;
  if (st.tafsir) tafsirEl.value = st.tafsir;
  if (st.mode) modeEl.value = st.mode;
  [reciterEl, transEl, tafsirEl, modeEl].forEach(function (s) {
    if (s.selectedIndex === -1) s.selectedIndex = 0;
  });

  khRender();
  getJSON(API + "/surah").then(function (j) {
    surahs = j.data;
    renderList("");
    var qp = parseInt(new URLSearchParams(window.location.search).get("surah"), 10);
    if (qp && surahs[qp - 1]) {
      openSurah(qp, { autoplay: false });
    } else if (st.surah && surahs[st.surah - 1]) {
      var s = surahs[st.surah - 1];
      var where = st.mode === "surah"
        ? (st.pos ? " at " + fmt(st.pos) : "")
        : (st.ayah ? " — āyah " + (st.ayah + 1) : "");
      resumeEl.innerHTML =
        "Continue where you left off — <strong>Sūrah " + s.englishName + "</strong>" + where + " · " +
        '<button type="button" class="q-tafbtn" style="margin:0" id="q-resume-btn">Resume</button>';
      resumeEl.hidden = false;
      document.getElementById("q-resume-btn").addEventListener("click", function () {
        openSurah(st.surah, { autoplay: true, seek: st.pos || 0, startAyah: st.ayah || 0 });
      });
    }
  }).catch(function () {
    listEl.innerHTML = "";
    listEl.appendChild(el("p", "q-status",
      "The sūrah list could not be loaded. Please check your connection and refresh, in shā' Allah."));
  });
})();
