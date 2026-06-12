/* ============================================================
   Masjidul Ikrām — prayer times widget
   Data: official salat.mv timetable for Hithadhoo, Addu City
   (assets/js/prayer-data.js — perpetual 366-day table).

   • Works without GSAP/Lenis — plain JS, nothing else required.
   • All times are Maldives time (Indian/Maldives, UTC+5, no DST),
     regardless of where the visitor is.
   • Countdown → adhān; between adhān and iqāmah it counts down
     to iqāmah; then moves to the next prayer.
   • Friday: Dhuhr is labelled Jumuʿah.

   SETTINGS YOU MAY EDIT ARE JUST BELOW.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- settings ---------------- */
  /* minutes from adhān to iqāmah — from the Masjidul Ikrām azan board */
  var IQAMA_MINUTES = { fajr: 20, dhuhr: 15, asr: 15, maghrib: 11, isha: 13 };
  var IQAMA_MINUTES_JUMUAH = 23; /* Friday: khutbah begins (12:12 → 12:35 on the board) */
  var JAMAAH_MINUTES = 10;       /* "congregation in prayer" state after iqāmah */
  var JAMAAH_MINUTES_JUMUAH = 45;/* longer on Fridays: khutbah + ṣalāh */
  var HIJRI_OFFSET_DAYS = 0;     /* set to 1 or -1 if local moon-sighting differs */
  var HOUR12 = true;             /* false = 24-hour clock */
  var MOSQUE_EN = "Masjidul Ikrām";
  var MOSQUE_AR = "مسجد الإكرام";
  var DUA_AR = "«إِنَّ الدُّعَاءَ لَا يُرَدُّ بَيْنَ الْأَذَانِ وَالْإِقَامَةِ»";
  var DUA_EN = "Duʿā' between the adhān and the iqāmah is not rejected — at-Tirmidhī";
  /* ------------------------------------------ */

  var DATA = window.IKRAM_PRAYER_DATA;
  var mount = document.getElementById("prayer-widget");        /* full band (home) */
  var ribbon = document.getElementById("prayer-ribbon");        /* slim header strip */
  var heroMini = document.getElementById("prayer-hero-mini");   /* hero countdown row */
  if (!DATA || !DATA.times || (!mount && !ribbon && !heroMini)) return;

  var TZ = "Indian/Maldives";
  var PRAYERS = [
    { key: "fajr",    i: 0, en: "Fajr",    ar: "الفجر" },
    { key: "sunrise", i: 1, en: "Sunrise", ar: "الشروق" },
    { key: "dhuhr",   i: 2, en: "Dhuhr",   ar: "الظهر" },
    { key: "asr",     i: 3, en: "ʿAsr",    ar: "العصر" },
    { key: "maghrib", i: 4, en: "Maghrib", ar: "المغرب" },
    { key: "isha",    i: 5, en: "ʿIshā",   ar: "العشاء" }
  ];
  /* cumulative days per month in the fixed 366-day table (Feb = 29) */
  var CUM = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

  var dtfParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
    weekday: "short", hour12: false
  });
  function nowMv() {
    var now = window.__PW_FAKE_NOW ? new Date(window.__PW_FAKE_NOW) : new Date();
    var p = {};
    dtfParts.formatToParts(now).forEach(function (x) { p[x.type] = x.value; });
    return {
      y: +p.year, m: +p.month, d: +p.day,
      weekday: p.weekday,                                  /* "Fri" etc. */
      mins: (+p.hour % 24) * 60 + (+p.minute),
      secs: (+p.hour % 24) * 3600 + (+p.minute) * 60 + (+p.second)
    };
  }
  function dayIndex(y, m, d) { return CUM[m - 1] + d - 1; }   /* table incl. Feb 29 */
  function rowFor(y, m, d) { return DATA.times[dayIndex(y, m, d)]; }
  function tomorrowOf(y, m, d) {
    var t = new Date(Date.UTC(y, m - 1, d) + 86400000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }
  function fmt(mins) {
    mins = ((mins % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60), mm = String(mins % 60).padStart(2, "0");
    if (!HOUR12) return String(h).padStart(2, "0") + ":" + mm;
    var ap = h < 12 ? "am" : "pm";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + mm + "<small>" + ap + "</small>";
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function hijriString(now) {
    var base = window.__PW_FAKE_NOW ? new Date(window.__PW_FAKE_NOW) : new Date();
    var dt = new Date(base.getTime() + HIJRI_OFFSET_DAYS * 86400000);
    try {
      return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        timeZone: TZ, day: "numeric", month: "long", year: "numeric"
      }).format(dt).replace(/\bAH\b/, "AH");
    } catch (e) { return ""; }
  }
  function gregString() {
    var base = window.__PW_FAKE_NOW ? new Date(window.__PW_FAKE_NOW) : new Date();
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(base);
  }
  function iqamaOf(key, adhan, t) {
    if (!(key in IQAMA_MINUTES)) return null;
    if (key === "dhuhr" && t && isFriday(t)) return adhan + IQAMA_MINUTES_JUMUAH;
    return adhan + IQAMA_MINUTES[key];
  }

  /* ---------------- moon phase ---------------- */
  var SYNODIC = 29.530588861;
  var NEW_MOON_JD = 2451550.26; /* 2000-01-06 18:14 UTC */
  function moonInfo() {
    var now = window.__PW_FAKE_NOW ? new Date(window.__PW_FAKE_NOW) : new Date();
    var jd = now.getTime() / 86400000 + 2440587.5;
    var age = (jd - NEW_MOON_JD) % SYNODIC;
    if (age < 0) age += SYNODIC;
    var p = age / SYNODIC;
    var illum = (1 - Math.cos(2 * Math.PI * p)) / 2;
    var names = [
      [1.85, "New Moon"], [5.54, "Waxing Crescent"], [9.23, "First Quarter"],
      [12.92, "Waxing Gibbous"], [16.61, "Full Moon"], [20.30, "Waning Gibbous"],
      [23.99, "Last Quarter"], [27.68, "Waning Crescent"], [99, "New Moon"]
    ];
    var name = "";
    for (var i = 0; i < names.length; i++) {
      if (age < names[i][0]) { name = names[i][1]; break; }
    }
    return { age: age, p: p, illum: illum, name: name, waxing: p < 0.5 };
  }

  /* SVG path of the LIT region. circle: c=(50,50) r=48, y-down coords. */
  function litPath(p) {
    var r = 48, T = "50,2", B = "50,98";
    var c = Math.cos(2 * Math.PI * p);
    var a = Math.max(0.01, Math.abs(c) * r);
    if (p < 0.5) { /* waxing — lit on the right */
      return c >= 0
        /* crescent: right limb out, terminator bulging right */
        ? "M" + T + " A" + r + "," + r + " 0 0 1 " + B + " A" + a + "," + r + " 0 0 0 " + T + " Z"
        /* gibbous: right limb out, terminator bulging left */
        : "M" + T + " A" + r + "," + r + " 0 0 1 " + B + " A" + a + "," + r + " 0 0 1 " + T + " Z";
    }
    return c <= 0
      /* waning gibbous: left limb, terminator bulging right */
      ? "M" + T + " A" + r + "," + r + " 0 0 0 " + B + " A" + a + "," + r + " 0 0 0 " + T + " Z"
      /* waning crescent: left limb, terminator bulging left */
      : "M" + T + " A" + r + "," + r + " 0 0 0 " + B + " A" + a + "," + r + " 0 0 1 " + T + " Z";
  }

  function moonSvg(m) {
    return '<svg class="pw-moonsvg" viewBox="0 0 100 100" role="img" aria-label="Current moon phase">' +
      '<defs>' +
      '<clipPath id="pw-mc"><circle cx="50" cy="50" r="48"/></clipPath>' +
      '<filter id="pw-ms" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.7"/></filter>' +
      '<mask id="pw-ml"><rect x="-10" y="-10" width="120" height="120" fill="#000"/>' +
      '<path d="' + litPath(m.p) + '" fill="#fff" filter="url(#pw-ms)"/></mask>' +
      '</defs>' +
      '<g clip-path="url(#pw-mc)">' +
      '<image href="assets/img/moon.jpg" x="0" y="0" width="100" height="100" opacity="0.22"/>' +
      '<image href="assets/img/moon.jpg" x="0" y="0" width="100" height="100" mask="url(#pw-ml)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="48" fill="none" stroke="rgba(217,184,120,.45)" stroke-width="1"/>' +
      '</svg>';
  }

  /* hijri day/month for badges */
  function hijriParts() {
    var base = window.__PW_FAKE_NOW ? new Date(window.__PW_FAKE_NOW) : new Date();
    var dt = new Date(base.getTime() + HIJRI_OFFSET_DAYS * 86400000);
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        timeZone: TZ, day: "numeric", month: "long"
      }).formatToParts(dt).forEach(function (x) { parts[x.type] = x.value; });
      return { day: +parts.day, month: parts.month || "" };
    } catch (e) { return { day: 0, month: "" }; }
  }
  function moonBadge(m) {
    var h = hijriParts();
    if (/shaww/i.test(h.month) && h.day === 1) return "Eid al-Fiṭr — عيد مبارك";
    if (/hijjah/i.test(h.month) && h.day === 10) return "Eid al-Aḍḥā — عيد مبارك";
    if (h.day === 1) return "1st night — new Hijri month";
    if (h.day >= 13 && h.day <= 15) return "Ayyām al-Bīḍ — the white days";
    if (m.name === "Full Moon") return "Badr — full moon";
    if (m.name === "New Moon") return "Conjunction — watch for the hilāl";
    return "";
  }

  /* Determine current state.
     mode: "adhan"  — counting down to the next adhān
           "iqama"  — adhān has been called; counting down to iqāmah
           "jamaah" — congregation in prayer (after iqāmah)            */
  function getState(t) {
    var row = rowFor(t.y, t.m, t.d);
    var list = PRAYERS.filter(function (p) { return p.key !== "sunrise"; });
    for (var k = 0; k < list.length; k++) {
      var p = list[k];
      var adhan = row[p.i], iq = iqamaOf(p.key, adhan, t);
      var jamaahMin = (p.key === "dhuhr" && isFriday(t)) ? JAMAAH_MINUTES_JUMUAH : JAMAAH_MINUTES;
      if (t.secs < adhan * 60) {
        return { prayer: p, mode: "adhan", target: adhan * 60, row: row };
      }
      if (t.secs < iq * 60) {
        return { prayer: p, mode: "iqama", target: iq * 60, span: (iq - adhan) * 60, row: row };
      }
      if (t.secs < (iq + jamaahMin) * 60) {
        return { prayer: p, mode: "jamaah", target: (iq + jamaahMin) * 60, row: row };
      }
    }
    /* past ʿIshā congregation → tomorrow's Fajr */
    var tm = tomorrowOf(t.y, t.m, t.d);
    var trow = rowFor(tm.y, tm.m, tm.d);
    return { prayer: list[0], mode: "adhan", target: 86400 + trow[0] * 60, row: row, nextRow: trow };
  }

  /* the prayer that follows the active one (for the quiet line in jamāʿah state) */
  function nextAfter(t, st) {
    var row = st.row;
    var list = PRAYERS.filter(function (p) { return p.key !== "sunrise"; });
    for (var k = 0; k < list.length; k++) {
      if (row[list[k].i] * 60 > st.target) {
        return { prayer: list[k], adhan: row[list[k].i], t: t };
      }
    }
    var tm = tomorrowOf(t.y, t.m, t.d);
    var trow = rowFor(tm.y, tm.m, tm.d);
    return { prayer: list[0], adhan: trow[0], t: t };
  }

  function isFriday(t) { return t.weekday === "Fri"; }
  function displayName(p, t) {
    if (p.key === "dhuhr" && isFriday(t)) return { en: "Jumuʿah", ar: "الجمعة" };
    return { en: p.en, ar: p.ar };
  }

  /* ---------------- render ---------------- */
  var els = {};
  function buildRibbon() {
    if (!ribbon) return;
    ribbon.innerHTML =
      '<a class="pr-in" href="' + (mount ? "#prayer-times" : "index.html#prayer-times") + '">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M50 0l12 26 26-12-12 26 24 10-24 10 12 26-26-12-12 26-12-26-26 12 12-26L0 60l24-10-12-26 26 12z"/></svg>' +
      '<span id="pr-name"></span><span class="pr-sep">·</span>' +
      '<span id="pr-meta"></span><span class="pr-sep">·</span>' +
      '<strong id="pr-count">--:--</strong></a>';
    els["pr-name"] = document.getElementById("pr-name");
    els["pr-meta"] = document.getElementById("pr-meta");
    els["pr-count"] = document.getElementById("pr-count");
  }
  function buildHeroMini(t) {
    if (!heroMini) return;
    var m = moonInfo();
    heroMini.innerHTML =
      '<div class="phm-moon">' + moonSvg(m) + "</div>" +
      '<div class="phm-txt"><span class="phm-label" id="phm-label">Next prayer</span>' +
      '<span class="phm-name" id="phm-name"></span>' +
      '<span class="phm-meta" id="phm-meta"></span></div>' +
      '<strong class="phm-count" id="phm-count">--:--</strong>';
    ["phm-label", "phm-name", "phm-meta", "phm-count"].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
  }
  function build(t) {
    buildRibbon();
    buildHeroMini(t);
    if (!mount) return;
    var row = rowFor(t.y, t.m, t.d);
    var html = "";
    html += '<div class="pw-head">';
    html += '<div class="pw-mosque"><svg viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M50 0l12 26 26-12-12 26 24 10-24 10 12 26-26-12-12 26-12-26-26 12 12-26L0 60l24-10-12-26 26 12z"/></svg>';
    html += '<span class="pw-mname">' + MOSQUE_EN + '</span><span class="pw-mar">' + MOSQUE_AR + '</span></div>';
    html += '<div class="pw-dates"><span id="pw-greg">' + gregString() + '</span><span id="pw-hijri">' + hijriString(t) + '</span></div>';
    html += '</div>';
    html += '<div class="pw-main">';
    html += '<div class="pw-next"><span class="pw-label" id="pw-label">Next prayer</span>';
    html += '<span class="pw-name" id="pw-name"></span>';
    html += '<span class="pw-count" id="pw-count">--:--:--</span>';
    html += '<span class="pw-iqbar" aria-hidden="true"><span class="pw-iqfill" id="pw-iqfill"></span></span>';
    html += '<span class="pw-meta" id="pw-meta"></span>';
    html += '<span class="pw-dua"><span class="pw-dua-ar">' + DUA_AR + '</span><span class="pw-dua-en">' + DUA_EN + "</span></span></div>";
    html += '<ul class="pw-strip" id="pw-strip"></ul>';
    var m = moonInfo();
    var badge = moonBadge(m);
    html += '<div class="pw-moon">' + moonSvg(m) +
      '<div class="pw-moontxt"><strong>' + m.name + "</strong>" +
      "<span>" + Math.round(m.illum * 100) + "% lit · " + m.age.toFixed(1) + " days</span>" +
      (badge ? '<em class="pw-badge">' + badge + "</em>" : "") +
      "</div></div>";
    html += '</div>';
    mount.innerHTML = html;
    ["pw-label", "pw-name", "pw-count", "pw-meta", "pw-strip", "pw-greg", "pw-hijri", "pw-iqfill"].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
    buildStrip(t, row);
    mount.classList.add("pw-ready");
  }

  function buildStrip(t, row) {
    if (!els["pw-strip"]) return;
    var st = getState(t);
    /* after ʿIshā the board rolls over to tomorrow's schedule */
    var rolled = !!st.nextRow;
    var dispRow = rolled ? st.nextRow : row;
    var fridayForLabels = isFriday(t);
    if (rolled) {
      var tm = tomorrowOf(t.y, t.m, t.d);
      fridayForLabels = new Date(Date.UTC(tm.y, tm.m - 1, tm.d)).getUTCDay() === 5;
    }
    var labelOf = function (p) {
      if (p.key === "dhuhr" && fridayForLabels) return { en: "Jumuʿah", ar: "الجمعة" };
      return { en: p.en, ar: p.ar };
    };
    var html = PRAYERS.map(function (p) {
      var nm = labelOf(p);
      var adhan = dispRow[p.i];
      var iq = iqamaOf(p.key, adhan, rolled ? null : t);
      if (p.key === "dhuhr" && fridayForLabels && rolled) iq = adhan + IQAMA_MINUTES_JUMUAH;
      var cls = [];
      if (p.key === "sunrise") cls.push("pw-sun");
      if (st.prayer.key === p.key) cls.push("is-next");
      else if (!rolled && adhan * 60 < t.secs && p.key !== "sunrise") cls.push("is-past");
      return '<li class="' + cls.join(" ") + '"><span class="pw-p">' + nm.en +
        '</span><strong>' + fmt(adhan) + "</strong>" +
        (iq ? '<small>Iqāmah ' + fmt(iq) + "</small>" : '<small>&nbsp;</small>') + "</li>";
    }).join("");
    els["pw-strip"].innerHTML = html;
  }

  var lastDay = null, lastPrayerKey = null, lastMode = null;
  function tick() {
    var t = nowMv();
    var dayKey = t.y + "-" + t.m + "-" + t.d;
    if (dayKey !== lastDay) {
      lastDay = dayKey;
      build(t);
      lastPrayerKey = null;
    }
    var st = getState(t);
    var nm = displayName(st.prayer, t);
    if (st.prayer.key !== lastPrayerKey || st.mode !== lastMode) {
      lastPrayerKey = st.prayer.key; lastMode = st.mode;
      var label =
        st.mode === "iqama" ? "Adhān called · iqāmah in" :
        st.mode === "jamaah" ? "Congregation in prayer" : "Next prayer";
      var row = st.nextRow || st.row;
      var adhan = row[st.prayer.i], iq = iqamaOf(st.prayer.key, adhan, t);
      var metaTxt = "Adhān " + fmt(adhan) + " &nbsp;·&nbsp; Iqāmah " + fmt(iq);
      if (st.mode === "jamaah") {
        var nx = nextAfter(t, st);
        var nxName = displayName(nx.prayer, t);
        metaTxt = "Next &nbsp;·&nbsp; " + nxName.en + " " + fmt(nx.adhan);
      }
      if (mount) {
        mount.classList.toggle("is-iqama", st.mode === "iqama");
        mount.classList.toggle("is-jamaah", st.mode === "jamaah");
      }
      if (els["pw-label"]) {
        els["pw-label"].textContent = label;
        els["pw-name"].innerHTML = nm.en + ' <span class="pw-ar">' + nm.ar + "</span>";
        els["pw-meta"].innerHTML = metaTxt;
        if (st.mode === "jamaah") els["pw-count"].innerHTML = "قَامَتِ الصَّلَاة";
        buildStrip(t, st.row);
      }
      if (els["pr-name"]) {
        els["pr-name"].textContent =
          st.mode === "iqama" ? nm.en + " — iqāmah" :
          st.mode === "jamaah" ? nm.en + " — in congregation" : nm.en;
        els["pr-meta"].innerHTML = metaTxt;
      }
      if (els["phm-label"]) {
        els["phm-label"].textContent = label;
        els["phm-name"].innerHTML = nm.en + ' <span class="pw-ar">' + nm.ar + "</span>";
        els["phm-meta"].innerHTML = metaTxt;
      }
    }
    var left = st.target - t.secs;
    if (left < 0) left = 0;
    var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
    var cd = (h > 0 ? pad(h) + ":" : "") + pad(m) + ":" + pad(s);
    if (st.mode === "jamaah") {
      /* digits rest while the congregation prays */
      if (els["pr-count"]) els["pr-count"].textContent = "ṣalāh in progress";
      if (els["phm-count"]) els["phm-count"].textContent = "—";
    } else {
      if (els["pw-count"]) els["pw-count"].textContent = cd;
      if (els["pr-count"]) els["pr-count"].textContent = "in " + cd;
      if (els["phm-count"]) els["phm-count"].textContent = cd;
    }
    if (st.mode === "iqama" && els["pw-iqfill"] && st.span) {
      els["pw-iqfill"].style.width = Math.max(0, Math.min(100, (left / st.span) * 100)).toFixed(2) + "%";
    }
  }

  build(nowMv());
  tick();
  setInterval(tick, 1000);
})();
