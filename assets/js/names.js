/* ============================================================
   IKRAM — names.js · Al-Asmā' al-Ḥusnā grid (classical list)
   ============================================================ */
(function () {
  "use strict";
  var grid = document.getElementById("names-grid");
  if (!grid) return;

  var NAMES = [
    ["ٱلرَّحْمَـٰنُ","Ar-Raḥmān","The Most Merciful"],
    ["ٱلرَّحِيمُ","Ar-Raḥīm","The Bestower of Mercy"],
    ["ٱلْمَلِكُ","Al-Malik","The King"],
    ["ٱلْقُدُّوسُ","Al-Quddūs","The Most Holy"],
    ["ٱلسَّلَامُ","As-Salām","The Source of Peace"],
    ["ٱلْمُؤْمِنُ","Al-Mu'min","The Giver of Security"],
    ["ٱلْمُهَيْمِنُ","Al-Muhaymin","The Guardian"],
    ["ٱلْعَزِيزُ","Al-'Azīz","The Almighty"],
    ["ٱلْجَبَّارُ","Al-Jabbār","The Compeller"],
    ["ٱلْمُتَكَبِّرُ","Al-Mutakabbir","The Supreme in Greatness"],
    ["ٱلْخَالِقُ","Al-Khāliq","The Creator"],
    ["ٱلْبَارِئُ","Al-Bāri'","The Originator"],
    ["ٱلْمُصَوِّرُ","Al-Muṣawwir","The Fashioner"],
    ["ٱلْغَفَّارُ","Al-Ghaffār","The Ever-Forgiving"],
    ["ٱلْقَهَّارُ","Al-Qahhār","The Subduer"],
    ["ٱلْوَهَّابُ","Al-Wahhāb","The Bestower"],
    ["ٱلرَّزَّاقُ","Ar-Razzāq","The Provider"],
    ["ٱلْفَتَّاحُ","Al-Fattāḥ","The Opener"],
    ["ٱلْعَلِيمُ","Al-'Alīm","The All-Knowing"],
    ["ٱلْقَابِضُ","Al-Qābiḍ","The Withholder"],
    ["ٱلْبَاسِطُ","Al-Bāsiṭ","The Extender"],
    ["ٱلْخَافِضُ","Al-Khāfiḍ","The Abaser"],
    ["ٱلرَّافِعُ","Ar-Rāfi'","The Exalter"],
    ["ٱلْمُعِزُّ","Al-Mu'izz","The Giver of Honour"],
    ["ٱلْمُذِلُّ","Al-Mudhill","The Humiliator"],
    ["ٱلسَّمِيعُ","As-Samī'","The All-Hearing"],
    ["ٱلْبَصِيرُ","Al-Baṣīr","The All-Seeing"],
    ["ٱلْحَكَمُ","Al-Ḥakam","The Judge"],
    ["ٱلْعَدْلُ","Al-'Adl","The Utterly Just"],
    ["ٱللَّطِيفُ","Al-Laṭīf","The Most Subtle and Kind"],
    ["ٱلْخَبِيرُ","Al-Khabīr","The All-Aware"],
    ["ٱلْحَلِيمُ","Al-Ḥalīm","The Most Forbearing"],
    ["ٱلْعَظِيمُ","Al-'Aẓīm","The Magnificent"],
    ["ٱلْغَفُورُ","Al-Ghafūr","The Great Forgiver"],
    ["ٱلشَّكُورُ","Ash-Shakūr","The Most Appreciative"],
    ["ٱلْعَلِيُّ","Al-'Aliyy","The Most High"],
    ["ٱلْكَبِيرُ","Al-Kabīr","The Most Great"],
    ["ٱلْحَفِيظُ","Al-Ḥafīẓ","The Preserver"],
    ["ٱلْمُقِيتُ","Al-Muqīt","The Sustainer"],
    ["ٱلْحَسِيبُ","Al-Ḥasīb","The Reckoner"],
    ["ٱلْجَلِيلُ","Al-Jalīl","The Majestic"],
    ["ٱلْكَرِيمُ","Al-Karīm","The Most Generous"],
    ["ٱلرَّقِيبُ","Ar-Raqīb","The Watchful"],
    ["ٱلْمُجِيبُ","Al-Mujīb","The Responsive One"],
    ["ٱلْوَاسِعُ","Al-Wāsi'","The All-Encompassing"],
    ["ٱلْحَكِيمُ","Al-Ḥakīm","The All-Wise"],
    ["ٱلْوَدُودُ","Al-Wadūd","The Most Loving"],
    ["ٱلْمَجِيدُ","Al-Majīd","The Glorious"],
    ["ٱلْبَاعِثُ","Al-Bā'ith","The Resurrector"],
    ["ٱلشَّهِيدُ","Ash-Shahīd","The Witness"],
    ["ٱلْحَقُّ","Al-Ḥaqq","The Absolute Truth"],
    ["ٱلْوَكِيلُ","Al-Wakīl","The Trustee"],
    ["ٱلْقَوِيُّ","Al-Qawiyy","The All-Strong"],
    ["ٱلْمَتِينُ","Al-Matīn","The Firm"],
    ["ٱلْوَلِيُّ","Al-Waliyy","The Protecting Friend"],
    ["ٱلْحَمِيدُ","Al-Ḥamīd","The Praiseworthy"],
    ["ٱلْمُحْصِي","Al-Muḥṣī","The All-Enumerating"],
    ["ٱلْمُبْدِئُ","Al-Mubdi'","The Originator of Creation"],
    ["ٱلْمُعِيدُ","Al-Mu'īd","The Restorer"],
    ["ٱلْمُحْيِي","Al-Muḥyī","The Giver of Life"],
    ["ٱلْمُمِيتُ","Al-Mumīt","The Bringer of Death"],
    ["ٱلْحَيُّ","Al-Ḥayy","The Ever-Living"],
    ["ٱلْقَيُّومُ","Al-Qayyūm","The Sustainer of All"],
    ["ٱلْوَاجِدُ","Al-Wājid","The Perceiver"],
    ["ٱلْمَاجِدُ","Al-Mājid","The Noble"],
    ["ٱلْوَاحِدُ","Al-Wāḥid","The One"],
    ["ٱلْأَحَدُ","Al-Aḥad","The Unique"],
    ["ٱلصَّمَدُ","Aṣ-Ṣamad","The Eternal Refuge"],
    ["ٱلْقَادِرُ","Al-Qādir","The All-Capable"],
    ["ٱلْمُقْتَدِرُ","Al-Muqtadir","The Omnipotent"],
    ["ٱلْمُقَدِّمُ","Al-Muqaddim","The One who Brings Forward"],
    ["ٱلْمُؤَخِّرُ","Al-Mu'akhkhir","The One who Delays"],
    ["ٱلْأَوَّلُ","Al-Awwal","The First"],
    ["ٱلْآخِرُ","Al-Ākhir","The Last"],
    ["ٱلظَّاهِرُ","Aẓ-Ẓāhir","The Manifest"],
    ["ٱلْبَاطِنُ","Al-Bāṭin","The Hidden"],
    ["ٱلْوَالِي","Al-Wālī","The Governor"],
    ["ٱلْمُتَعَالِي","Al-Muta'ālī","The Most Exalted"],
    ["ٱلْبَرُّ","Al-Barr","The Source of All Goodness"],
    ["ٱلتَّوَّابُ","At-Tawwāb","The Acceptor of Repentance"],
    ["ٱلْمُنْتَقِمُ","Al-Muntaqim","The Avenger"],
    ["ٱلْعَفُوُّ","Al-'Afuww","The Pardoner"],
    ["ٱلرَّءُوفُ","Ar-Ra'ūf","The Most Kind"],
    ["مَالِكُ ٱلْمُلْكِ","Mālik-ul-Mulk","Owner of the Dominion"],
    ["ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ","Dhul-Jalāli wal-Ikrām","Owner of Majesty and Honour"],
    ["ٱلْمُقْسِطُ","Al-Muqsiṭ","The Equitable"],
    ["ٱلْجَامِعُ","Al-Jāmi'","The Gatherer"],
    ["ٱلْغَنِيُّ","Al-Ghaniyy","The Self-Sufficient"],
    ["ٱلْمُغْنِي","Al-Mughnī","The Enricher"],
    ["ٱلْمَانِعُ","Al-Māni'","The Preventer of Harm"],
    ["ٱلضَّارُّ","Aḍ-Ḍārr","The One who Decrees Harm"],
    ["ٱلنَّافِعُ","An-Nāfi'","The Giver of Benefit"],
    ["ٱلنُّورُ","An-Nūr","The Light"],
    ["ٱلْهَادِي","Al-Hādī","The Guide"],
    ["ٱلْبَدِيعُ","Al-Badī'","The Incomparable Originator"],
    ["ٱلْبَاقِي","Al-Bāqī","The Everlasting"],
    ["ٱلْوَارِثُ","Al-Wārith","The Inheritor of All"],
    ["ٱلرَّشِيدُ","Ar-Rashīd","The Guide to the Right Path"],
    ["ٱلصَّبُورُ","Aṣ-Ṣabūr","The Most Patient"]
  ];

  function render(filter) {
    var f = (filter || "").trim().toLowerCase();
    grid.innerHTML = "";
    NAMES.forEach(function (n, i) {
      var hay = (n[1] + " " + n[2]).toLowerCase();
      if (f && hay.indexOf(f) === -1) return;
      var c = document.createElement("div");
      c.className = "name-card";
      c.innerHTML =
        '<span class="n">' + (i + 1) + "</span>" +
        '<span class="ar" lang="ar" dir="rtl">' + n[0] + "</span>" +
        '<span class="tl">' + n[1] + "</span>" +
        '<span class="mn">' + n[2] + "</span>";
      grid.appendChild(c);
    });
    if (!grid.children.length) {
      grid.innerHTML = '<p class="q-status" style="grid-column:1/-1">No name matches that search.</p>';
    }
  }

  document.getElementById("n-search").addEventListener("input", function (e) {
    render(e.target.value);
  });
  render("");
})();
