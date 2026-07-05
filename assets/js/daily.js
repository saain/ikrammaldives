/* ============================================================
   IKRAM — daily.js · Āyah + ḥadīth of the day (homepage)
   Āyah: curated references, text fetched from Al Quran Cloud;
   the card stays hidden if the API is unreachable.
   Ḥadīth: curated authentic selections, rotated by date.
   ============================================================ */
(function () {
  "use strict";
  var ayahCard = document.getElementById("daily-ayah");
  var hadithCard = document.getElementById("daily-hadith");
  if (!ayahCard && !hadithCard) return;

  var API = "https://api.alquran.cloud/v1";

  /* surah:ayah — uplifting, standalone verses */
  var AYAHS = [
    "2:152", "2:186", "2:286", "3:139", "3:159", "13:28", "16:97", "14:7",
    "20:114", "21:107", "24:35", "25:74", "29:69", "39:53", "40:60", "49:13",
    "51:56", "55:13", "65:3", "67:2", "93:5", "94:6", "17:80", "8:2"
  ];

  var HADITHS = [
    { ar: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ", en: "Actions are only by intentions, and every person shall have only what they intended.", src: "al-Bukhārī & Muslim" },
    { ar: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", en: "None of you truly believes until he loves for his brother what he loves for himself.", src: "al-Bukhārī & Muslim" },
    { ar: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", en: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.", src: "al-Bukhārī & Muslim" },
    { ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", en: "The best of you are those who learn the Qur'ān and teach it.", src: "al-Bukhārī" },
    { ar: "الطُّهُورُ شَطْرُ الْإِيمَانِ", en: "Purity is half of faith.", src: "Muslim" },
    { ar: "لَا تَحْقِرَنَّ مِنَ الْمَعْرُوفِ شَيْئًا وَلَوْ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ", en: "Do not belittle any good deed, even meeting your brother with a cheerful face.", src: "Muslim" },
    { ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ", en: "Whoever travels a path in search of knowledge, Allah makes easy for him a path to Paradise.", src: "Muslim" },
    { ar: "الدُّعَاءُ هُوَ الْعِبَادَةُ", en: "Supplication — it is worship itself.", src: "Abū Dāwūd, at-Tirmidhī" },
    { ar: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", en: "The most beloved deeds to Allah are the most consistent, even if small.", src: "al-Bukhārī & Muslim" },
    { ar: "مَنْ لَا يَرْحَمُ النَّاسَ لَا يَرْحَمُهُ اللَّهُ", en: "Whoever does not show mercy to people, Allah will not show mercy to him.", src: "al-Bukhārī & Muslim" },
    { ar: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ", en: "Be mindful of Allah wherever you are; follow a bad deed with a good deed and it will erase it; and treat people with beautiful character.", src: "at-Tirmidhī — ḥasan" },
    { ar: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ", en: "A good word is charity.", src: "al-Bukhārī & Muslim" },
    { ar: "يَسِّرُوا وَلَا تُعَسِّرُوا، وَبَشِّرُوا وَلَا تُنَفِّرُوا", en: "Make things easy and do not make them difficult; give glad tidings and do not drive people away.", src: "al-Bukhārī & Muslim" },
    { ar: "مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا", en: "Whoever sends blessings upon me once, Allah sends blessings upon him tenfold.", src: "Muslim" },
    { ar: "لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ", en: "He has not thanked Allah who does not thank people.", src: "Abū Dāwūd, at-Tirmidhī" },
    { ar: "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَـٰنُ", en: "The merciful are shown mercy by the Most Merciful. Show mercy to those on earth, and the One above the heavens will show mercy to you.", src: "Abū Dāwūd, at-Tirmidhī" }
  ];

  /* day-of-year index so the whole community sees the same portion */
  var now = new Date();
  var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);

  if (hadithCard) {
    var h = HADITHS[doy % HADITHS.length];
    document.getElementById("dh-ar").textContent = h.ar;
    document.getElementById("dh-en").textContent = "“" + h.en + "” — the Messenger of Allah ﷺ";
    document.getElementById("dh-src").textContent = h.src;
  }

  if (ayahCard) {
    var ref = AYAHS[doy % AYAHS.length];
    Promise.all([
      fetch(API + "/ayah/" + ref + "/quran-uthmani").then(function (r) { return r.json(); }),
      fetch(API + "/ayah/" + ref + "/en.sahih").then(function (r) { return r.json(); })
    ]).then(function (res) {
      var a = res[0].data, t = res[1].data;
      document.getElementById("da-ar").textContent = a.text;
      document.getElementById("da-en").textContent = "“" + t.text + "”";
      document.getElementById("da-src").textContent =
        "Sūrah " + a.surah.englishName + " · " + a.surah.number + ":" + a.numberInSurah;
      document.getElementById("da-link").href = "quran.html?surah=" + a.surah.number;
      ayahCard.hidden = false;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }).catch(function () { /* API unreachable — card stays hidden */ });
  }
})();
