/* ============================================================
   IKRAM — quran.js · Qur'ān listening page
   Data: Al Quran Cloud (api.alquran.cloud, keyless, CORS-open)
   Audio: cdn.islamic.network full-surah mp3 (128kbps)
   Tafsīr: Ibn Kathīr (En, abridged) via spa5k/tafsir_api on
   jsDelivr, fetched per-āyah on demand; al-Muyassar (Ar) via
   Al Quran Cloud editions.
   State (last surah/reciter/position) kept in localStorage.
   ============================================================ */
(function () {
  "use strict";

  var listEl = document.getElementById("q-list");
  if (!listEl) return; // not on this page

  var API = "https://api.alquran.cloud/v1";
  var AUDIO = "https://cdn.islamic.network/quran/audio-surah/128/";
  var TAFSIR_CDN = [
    "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/en-tafisr-ibn-kathir/",
    "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/en-tafsir-ibn-kathir/"
  ];
  var STORE = "ikram-quran";

  var readerEl = document.getElementById("q-reader");
  var searchEl = document.getElementById("q-search");
  var reciterEl = document.getElementById("q-reciter");
  var transEl = document.getElementById("q-trans");
  var tafsirEl = document.getElementById("q-tafsir");
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

  var surahs = [];
  var current = null;          // surah meta currently loaded
  var pendingSeek = null;      // resume position once metadata is ready
  var muyassarCache = {};      // surah number -> array of tafsir texts

  /* ---------- tiny helpers ---------- */
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
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
      return r.json();
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
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
      row.dataset.n = s.number;
      row.innerHTML =
        '<span class="q-num">' + s.number + "</span>" +
        '<span class="q-names"><strong>' + s.englishName + "</strong><span>" +
        s.englishNameTranslation + " · " + s.numberOfAyahs + " āyāt</span></span>" +
        '<span class="q-ar" lang="ar" dir="rtl">' + s.name.replace(/^سُورَةُ\s*/, "") + "</span>";
      row.addEventListener("click", function () { openSurah(s.number, { autoplay: true }); });
      listEl.appendChild(row);
    });
    if (!shown) listEl.appendChild(el("p", "q-status", "No sūrah matches that search."));
  }

  /* ---------- reader ---------- */
  function openSurah(n, opts) {
    opts = opts || {};
    var s = surahs[n - 1];
    if (!s) return;
    current = s;
    renderList(searchEl.value);
    readerEl.innerHTML = "";
    readerEl.appendChild(el("p", "q-status", "Loading Sūrah " + s.englishName + "…"));

    var wantTrans = transEl.value !== "none";
    var reqs = [getJSON(API + "/surah/" + n + "/quran-uthmani")];
    if (wantTrans) reqs.push(getJSON(API + "/surah/" + n + "/" + transEl.value));

    Promise.all(reqs).then(function (res) {
      var ar = res[0].data.ayahs;
      var tr = wantTrans && res[1] ? res[1].data.ayahs : null;
      readerEl.innerHTML = "";
      readerEl.appendChild(el("h2", null, s.englishName + ' <span class="q-ar" lang="ar" dir="rtl" style="font-size:1.4rem">' + s.name + "</span>"));
      readerEl.appendChild(el("p", "q-sub", s.englishNameTranslation + " · " + s.revelationType + " · " + s.numberOfAyahs + " āyāt"));
      if (n !== 1 && n !== 9) {
        readerEl.appendChild(el("p", "q-bismillah", "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ"));
      }
      ar.forEach(function (a, i) {
        var text = a.text;
        /* strip the basmala that the API prefixes to āyah 1 (except 1:1, 9:1) */
        if (i === 0 && n !== 1 && n !== 9) {
          text = text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s*/, "");
        }
        var block = el("div", "q-ayah");
        block.innerHTML =
          '<span class="ar" lang="ar" dir="rtl">' + text +
          ' <span class="marker">' + s.number + ":" + a.numberInSurah + "</span></span>" +
          (tr ? '<span class="tr"' + (transEl.value.indexOf("dv.") === 0 ? ' lang="dv" dir="rtl"' : "") + ">" + tr[i].text + "</span>" : "");
        if (tafsirEl.value !== "none") {
          var btn = el("button", "q-tafbtn", "Tafsīr");
          btn.type = "button";
          btn.addEventListener("click", function () { toggleTafsir(block, btn, s.number, a.numberInSurah); });
          block.appendChild(btn);
        }
        readerEl.appendChild(block);
      });
      readerEl.scrollTop = 0;
    }).catch(function () {
      readerEl.innerHTML = "";
      readerEl.appendChild(el("p", "q-status",
        "The Qur'ān service could not be reached just now. Please check your connection and try again, in shā' Allah."));
    });

    /* audio */
    audio.src = AUDIO + reciterEl.value + "/" + n + ".mp3";
    nowName.textContent = "Sūrah " + s.englishName;
    nowSub.textContent = reciterEl.options[reciterEl.selectedIndex].text;
    player.classList.add("on");
    document.body.classList.add("has-player");
    fillEl.style.width = "0";
    if (opts.seek) pendingSeek = opts.seek;
    if (opts.autoplay) audio.play().catch(function () {});
    save({ surah: n, reciter: reciterEl.value, trans: transEl.value, tafsir: tafsirEl.value, pos: opts.seek || 0 });
    if (resumeEl) resumeEl.hidden = true;
  }

  /* ---------- tafsīr ---------- */
  function toggleTafsir(block, btn, surah, ayah) {
    var existing = block.querySelector(".q-taf");
    if (existing) { existing.remove(); btn.textContent = "Tafsīr"; return; }
    btn.textContent = "Loading…";
    var done = function (html, langAr, srcName) {
      btn.textContent = "Hide tafsīr";
      var more =
        ' · <a href="https://www.altafsir.com/Tafasir.asp?tMadhNo=0&amp;tTafsirNo=74&amp;tSoraNo=' +
        surah + "&amp;tAyahNo=" + ayah +
        '&amp;tDisplay=yes&amp;LanguageID=2" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">More tafāsīr — Altafsir.com</a>';
      var t = el("div", "q-taf", html + '<span class="q-taf-src">' + srcName + more + "</span>");
      if (langAr) { t.setAttribute("lang", "ar"); t.setAttribute("dir", "rtl"); }
      block.appendChild(t);
    };
    var fail = function () {
      btn.textContent = "Tafsīr";
      var t = el("div", "q-taf", "Tafsīr could not be loaded for this āyah right now.");
      block.appendChild(t);
      setTimeout(function () { t.remove(); }, 3500);
    };

    if (tafsirEl.value === "ar.muyassar") {
      var cached = muyassarCache[surah];
      var p = cached
        ? Promise.resolve(cached)
        : getJSON(API + "/surah/" + surah + "/ar.muyassar").then(function (j) {
            muyassarCache[surah] = j.data.ayahs;
            return j.data.ayahs;
          });
      p.then(function (ayahs) {
        done(ayahs[ayah - 1].text, true, "تفسير الميسّر — مجمع الملك فهد");
      }).catch(fail);
      return;
    }

    /* Ibn Kathīr via CDN — try known edition slugs in order */
    var tryFetch = function (i) {
      if (i >= TAFSIR_CDN.length) { fail(); return; }
      getJSON(TAFSIR_CDN[i] + surah + "_" + ayah + ".json").then(function (j) {
        var text = (j && (j.text || j.tafsir || j.content)) || "";
        if (!text) { fail(); return; }
        done(text, false, "Tafsīr Ibn Kathīr (abridged)");
      }).catch(function () { tryFetch(i + 1); });
    };
    tryFetch(0);
  }

  /* ---------- player wiring ---------- */
  playBtn.addEventListener("click", function () {
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  });
  document.getElementById("q-prev").addEventListener("click", function () {
    if (current && current.number > 1) openSurah(current.number - 1, { autoplay: true });
  });
  document.getElementById("q-next").addEventListener("click", function () {
    if (current && current.number < 114) openSurah(current.number + 1, { autoplay: true });
  });
  audio.addEventListener("play", function () { icPlay.style.display = "none"; icPause.style.display = "block"; });
  audio.addEventListener("pause", function () { icPlay.style.display = "block"; icPause.style.display = "none"; });
  audio.addEventListener("loadedmetadata", function () {
    durEl.textContent = fmt(audio.duration);
    if (pendingSeek && isFinite(audio.duration) && pendingSeek < audio.duration - 5) {
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
    if (++tick % 8 === 0 && current) save({ pos: Math.floor(audio.currentTime) });
  });
  audio.addEventListener("ended", function () {
    save({ pos: 0 });
    if (current && current.number < 114) openSurah(current.number + 1, { autoplay: true });
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
    if (current) {
      var wasPlaying = !audio.paused;
      var at = audio.currentTime;
      openSurah(current.number, { autoplay: wasPlaying, seek: at });
    }
  });
  transEl.addEventListener("change", function () {
    save({ trans: transEl.value });
    if (current) openSurah(current.number, { autoplay: false, seek: audio.currentTime });
  });
  tafsirEl.addEventListener("change", function () {
    save({ tafsir: tafsirEl.value });
    if (current) openSurah(current.number, { autoplay: false, seek: audio.currentTime });
  });

  /* ---------- boot ---------- */
  var st = load();
  if (st.reciter) reciterEl.value = st.reciter;
  if (st.trans) transEl.value = st.trans;
  if (st.tafsir) tafsirEl.value = st.tafsir;
  if (reciterEl.selectedIndex === -1) reciterEl.selectedIndex = 0;
  if (transEl.selectedIndex === -1) transEl.selectedIndex = 0;
  if (tafsirEl.selectedIndex === -1) tafsirEl.selectedIndex = 0;

  getJSON(API + "/surah").then(function (j) {
    surahs = j.data;
    renderList("");
    if (st.surah && surahs[st.surah - 1]) {
      var s = surahs[st.surah - 1];
      resumeEl.innerHTML =
        'Continue where you left off — <strong>Sūrah ' + s.englishName + "</strong>" +
        (st.pos ? " at " + fmt(st.pos) : "") + " · " +
        '<button type="button" class="q-tafbtn" style="margin:0" id="q-resume-btn">Resume</button>';
      resumeEl.hidden = false;
      document.getElementById("q-resume-btn").addEventListener("click", function () {
        openSurah(st.surah, { autoplay: true, seek: st.pos || 0 });
      });
    }
  }).catch(function () {
    listEl.innerHTML = "";
    listEl.appendChild(el("p", "q-status",
      "The sūrah list could not be loaded. Please check your connection and refresh, in shā' Allah."));
  });
})();
