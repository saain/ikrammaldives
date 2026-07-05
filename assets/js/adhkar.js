/* ============================================================
   IKRAM — adhkar.js · Daily adhkār with tap counters
   A curated selection of the essential authentic adhkār.
   Qur'ānic portions (Āyat al-Kursī + the three Quls) are fetched
   from Al Quran Cloud so the Qur'ān text is exact.
   Counts persist per calendar day in localStorage.
   ============================================================ */
(function () {
  "use strict";

  var listEl = document.getElementById("adk-list");
  if (!listEl) return;

  var API = "https://api.alquran.cloud/v1";
  var STORE = "ikram-adhkar";

  /* q: quranic reference to fetch — {ayah:"2:255"} or {surah:112} */
  var QURANIC = [
    { id: "kursi", q: { ayah: "2:255" }, title: "Āyat al-Kursī", src: "Sūrah al-Baqarah 2:255", count: 1,
      en: "Whoever recites it in the morning is protected until the evening, and whoever recites it in the evening is protected until the morning." },
    { id: "ikhlas", q: { surah: 112 }, title: "Sūrah al-Ikhlāṣ", src: "Qur'ān 112 · Abū Dāwūd, at-Tirmidhī", count: 3,
      en: "The three Quls, recited three times morning and evening, suffice you against all things." },
    { id: "falaq", q: { surah: 113 }, title: "Sūrah al-Falaq", src: "Qur'ān 113 · Abū Dāwūd, at-Tirmidhī", count: 3, en: "" },
    { id: "nas", q: { surah: 114 }, title: "Sūrah an-Nās", src: "Qur'ān 114 · Abū Dāwūd, at-Tirmidhī", count: 3, en: "" }
  ];

  var SETS = {
    morning: [
      "kursi", "ikhlas", "falaq", "nas",
      { id: "m-mulk", count: 1, src: "Muslim",
        ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        en: "We have entered the morning, and the dominion has entered the morning belonging to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, without partner: His is the dominion, His is the praise, and He is able to do all things." },
      { id: "m-bika", count: 1, src: "at-Tirmidhī",
        ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
        en: "O Allah, by You we enter the morning and by You we enter the evening; by You we live and by You we die, and to You is the resurrection." },
      { id: "sayyid", count: 1, src: "al-Bukhārī",
        ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        en: "Sayyid al-Istighfār — the master supplication of seeking forgiveness: O Allah, You are my Lord; none has the right to be worshipped except You. You created me and I am Your servant, and I keep Your covenant and promise as far as I am able. I seek refuge in You from the evil of what I have done. I acknowledge before You Your blessing upon me, and I acknowledge my sin — so forgive me, for none forgives sins except You." },
      { id: "bismillah3", count: 3, src: "Abū Dāwūd, at-Tirmidhī",
        ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        en: "In the Name of Allah, with whose Name nothing on earth or in heaven can cause harm — and He is the All-Hearing, the All-Knowing." },
      { id: "raditu", count: 3, src: "Abū Dāwūd",
        ar: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
        en: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet." },
      { id: "yahayyu", count: 1, src: "al-Ḥākim — ḥasan",
        ar: "يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        en: "O Ever-Living, O Sustainer, by Your mercy I seek help: set right all my affairs, and do not leave me to myself for the blink of an eye." },
      { id: "subhan100", count: 100, src: "Muslim",
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        en: "Glory be to Allah and praise be to Him — whoever says it a hundred times in a day, his sins are wiped away even if they were like the foam of the sea." }
    ],
    evening: [
      "kursi", "ikhlas", "falaq", "nas",
      { id: "e-mulk", count: 1, src: "Muslim",
        ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        en: "We have entered the evening, and the dominion has entered the evening belonging to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, without partner: His is the dominion, His is the praise, and He is able to do all things." },
      { id: "e-bika", count: 1, src: "at-Tirmidhī",
        ar: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
        en: "O Allah, by You we enter the evening and by You we enter the morning; by You we live and by You we die, and to You is the final return." },
      "sayyid",
      { id: "kalimat", count: 3, src: "Muslim",
        ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        en: "I seek refuge in the perfect words of Allah from the evil of what He has created." },
      "bismillah3", "raditu", "yahayyu", "subhan100"
    ],
    salah: [
      { id: "s-istighfar", count: 3, src: "Muslim",
        ar: "أَسْتَغْفِرُ اللَّهَ",
        en: "I seek the forgiveness of Allah." },
      { id: "s-salam", count: 1, src: "Muslim",
        ar: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
        en: "O Allah, You are as-Salām (the source of peace), and from You is all peace. Blessed are You, O Owner of Majesty and Honour." },
      { id: "s-lailaha", count: 1, src: "al-Bukhārī, Muslim",
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
        en: "None has the right to be worshipped except Allah alone, without partner: His is the dominion and His is the praise, and He is able to do all things. O Allah, none can withhold what You give, and none can give what You withhold, and the might of the mighty cannot benefit them against You." },
      { id: "s-subhan", count: 33, src: "Muslim",
        ar: "سُبْحَانَ اللَّهِ",
        en: "Glory be to Allah." },
      { id: "s-hamd", count: 33, src: "Muslim",
        ar: "الْحَمْدُ لِلَّهِ",
        en: "All praise is for Allah." },
      { id: "s-akbar", count: 33, src: "Muslim",
        ar: "اللَّهُ أَكْبَرُ",
        en: "Allah is the Greatest — then complete the hundred with: lā ilāha illa Allāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli shay'in qadīr." },
      "kursi", "ikhlas", "falaq", "nas"
    ]
  };

  var quranText = {};   // id -> arabic html
  var activeSet = (new Date().getHours() >= 14) ? "evening" : "morning";

  /* ---------- per-day counts ---------- */
  function today() { return new Date().toISOString().slice(0, 10); }
  function loadCounts() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE)) || {};
      if (s.date !== today()) return { date: today(), counts: {} };
      return s;
    } catch (e) { return { date: today(), counts: {} }; }
  }
  function saveCounts(s) {
    try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {}
  }

  function itemById(id) {
    var q = QURANIC.filter(function (x) { return x.id === id; })[0];
    if (q) return q;
    var found = null;
    Object.keys(SETS).forEach(function (k) {
      SETS[k].forEach(function (it) {
        if (typeof it === "object" && it.id === id) found = it;
      });
    });
    return found;
  }

  /* ---------- render ---------- */
  function render() {
    var state = loadCounts();
    listEl.innerHTML = "";
    SETS[activeSet].forEach(function (raw) {
      var it = typeof raw === "string" ? itemById(raw) : raw;
      if (!it) return;
      var key = activeSet + ":" + it.id;
      var n = state.counts[key] || 0;
      var card = document.createElement("div");
      card.className = "adk" + (n >= it.count ? " is-done" : "");
      var arHtml = it.q
        ? (quranText[it.id] || '<em style="font-family:var(--sans);font-size:.85rem;color:var(--muted)">Loading the Qur’ān text…</em>')
        : it.ar;
      card.innerHTML =
        (it.title ? '<div class="adk-body"><strong style="font-family:var(--serif);font-size:1.15rem;color:var(--ink)">' + it.title + "</strong>" : '<div class="adk-body">') +
        '<span class="ar" lang="ar" dir="rtl">' + arHtml + "</span>" +
        (it.en ? '<p class="en">' + it.en + "</p>" : "") +
        '<span class="src">' + it.src + " · recite ×" + it.count + "</span></div>";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "adk-count";
      btn.setAttribute("aria-label", "Count this dhikr");
      btn.innerHTML = "<strong>" + n + "</strong><span>of " + it.count + "</span>";
      btn.addEventListener("click", function () {
        var st = loadCounts();
        var v = (st.counts[key] || 0) + 1;
        if (v > it.count) v = 0; /* tap past the target to reset this one */
        st.counts[key] = v;
        saveCounts(st);
        btn.innerHTML = "<strong>" + v + "</strong><span>of " + it.count + "</span>";
        card.classList.toggle("is-done", v >= it.count);
      });
      card.appendChild(btn);
      listEl.appendChild(card);
    });
  }

  /* ---------- tabs ---------- */
  var tabs = document.querySelectorAll(".adk-tabs [data-set]");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      activeSet = t.getAttribute("data-set");
      tabs.forEach(function (x) {
        var on = x === t;
        x.classList.toggle("btn-primary", on);
        x.classList.toggle("btn-ghost", !on);
        x.setAttribute("aria-selected", on ? "true" : "false");
      });
      render();
    });
    if (t.getAttribute("data-set") === activeSet) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.classList.toggle("btn-primary", on);
        x.classList.toggle("btn-ghost", !on);
        x.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
  });

  document.getElementById("adk-reset").addEventListener("click", function () {
    var st = loadCounts();
    Object.keys(st.counts).forEach(function (k) {
      if (k.indexOf(activeSet + ":") === 0) delete st.counts[k];
    });
    saveCounts(st);
    render();
  });

  /* ---------- boot: fetch the Qur'ānic portions ---------- */
  render();
  function fetchQ(it) {
    var url = it.q.ayah
      ? API + "/ayah/" + it.q.ayah + "/quran-uthmani"
      : API + "/surah/" + it.q.surah + "/quran-uthmani";
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (it.q.ayah) {
        quranText[it.id] = j.data.text;
      } else {
        quranText[it.id] = j.data.ayahs.map(function (a, i) {
          var t = a.text;
          if (i === 0 && it.q.surah !== 1 && it.q.surah !== 9) {
            t = t.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s*/, "");
          }
          return t;
        }).join(" ۝ ");
      }
    }).catch(function () {
      quranText[it.id] = '<em style="font-family:var(--sans);font-size:.85rem">Could not load — please recite from your muṣḥaf or the Qur’ān tab.</em>';
    });
  }
  Promise.all(QURANIC.map(fetchQ)).then(render);
})();
