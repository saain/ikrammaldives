#!/usr/bin/env python3
"""
dv-skeleton.py — bilingual helper for the IKRAM site.

  python3 tools/dv-skeleton.py            # 1) adds the EN/ދިވެހި switch + hreflang to English pages
                                          # 2) creates dv/<page>.html for any root page that has no
                                          #    Dhivehi version yet (never overwrites an existing one)

A Dhivehi skeleton = the English page with lang="dv" dir="rtl", the header / footer / buttons
in Dhivehi, asset paths pointing one folder up, and every content <section> marked
lang="en" dir="ltr" data-dv="pending" until it is translated. Translating a section means:
remove those three attributes from the <section> and replace its text.
"""
import os, re, sys, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.ikrammaldives.org"
PAGES = ["index", "about", "quran", "articles", "article", "answers", "resources",
         "events", "contact", "support", "adhkar", "names", "live"]
ILM = ["ilm/index.html", "ilm/seerah/index.html", "ilm/seerah/badr/index.html", "ilm/seerah/hilyah/index.html"]

# ---------------------------------------------------------------- Dhivehi chrome
NAV_DV = [  # (href, label)  — same order as the English nav
    ("index.html", "މައި ޞަފްޙާ"),
    ("about.html", "ތަޢާރަފް"),
    ("quran.html", "ޤުރުއާން"),
    ("articles.html", "ލިޔުންތައް"),
    ("../ilm/", "ޢިލްމު"),
    ("answers.html", "ސުވާލާއި ޖަވާބު"),
    ("resources.html", "ވަސީލަތްތައް"),
    ("events.html", "ޕްރޮގްރާމްތައް"),
    ("contact.html", "ގުޅުއްވާ"),
]
SUPPORT_DV = "އިކްރާމަށް އެހީވެދެއްވާ"
SKIP_DV = "މައިގަނޑު ބަޔަށް ދާން"
MENU_DV = "މެނޫ"

FOOTER_DV = """<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top" data-stagger>
      <div class="footer-about">
        <a class="brand" href="index.html"><img class="logo logo-terra" src="../assets/img/logos/ikram-logo-maroon.svg" alt="IKRAM" width="80" height="60" /><img class="logo logo-cream" src="../assets/img/logos/ikram-logo-cream.svg" alt="IKRAM" width="80" height="60" /></a>
        <p>ފައިދާހުރި ޢިލްމު ފެތުރުމަށާއި، ޙިކުމަތާއި ރަޙްމަތާއެކު ހިތްތައް ﷲ އަށް ދަޢުވަތު ދިނުމަށް މަސައްކަތްކުރާ ދަޢުވާ ޖަމްޢިއްޔާއެއް.</p>
      </div>
      <div class="footer-col"><h5>ބައްލަވާ</h5><a href="about.html">އަޅުގަނޑުމެންގެ ތަޢާރަފް</a><a href="articles.html">ލިޔުންތައް</a><a href="../ilm/">ޢިލްމު ލައިބްރަރީ</a><a href="answers.html">ސުވާލާއި ޖަވާބު</a><a href="resources.html">ވަސީލަތްތައް</a><a href="events.html">ޕްރޮގްރާމްތައް</a></div>
      <div class="footer-col"><h5>އުނގެނުން</h5><a href="quran.html">ޤުރުއާން އަޑުއައްސަވާ</a><a href="live.html">މައްކާ އަދި މަދީނާ ލައިވް</a><a href="adhkar.html">އަޛްކާރު</a><a href="names.html">ﷲގެ 99 ނަންފުޅު</a><a href="../ilm/seerah/">ސީރަތު ލައިބްރަރީ</a><a href="resources.html">އޯޑިއޯ ދަރުސްތައް</a><a href="resources.html">ޑައުންލޯޑްތައް</a></div>
      <div class="footer-col"><h5>ގުޅުން</h5><a href="contact.html">ގުޅުއްވާ</a><a href="contact.html">ވޮލަންޓިއަރު</a><a href="support.html">އެހީތެރިވުން</a><a href="contact.html">ނިއުސްލެޓަރ</a></div>
    </div>
    <div class="footer-bottom">
      <p>© <span id="year"></span> އިކްރާމް މޯލްޑިވްސް. ހުރިހާ ޙައްޤުތަކެއް ލިބިގެންވެއެވެ.</p>
      <div class="socials">
        <a href="https://www.instagram.com/ikrammaldives" target="_blank" rel="noopener" aria-label="އިންސްޓަގްރާމްގައި އިކްރާމް"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
      </div>
    </div>
  </div>
</footer>"""


def switch_en(dv_href):
    return ('<a class="lang-switch" href="%s" hreflang="dv" aria-label="ދިވެހި"><span aria-current="true">EN</span>'
            '<span class="sep"></span><span lang="dv">ދިވެހި</span></a>' % dv_href)


def switch_dv(en_href):
    return ('<a class="lang-switch" href="%s" hreflang="en" aria-label="English"><span lang="dv" aria-current="true">ދިވެހި</span>'
            '<span class="sep"></span><span lang="en">EN</span></a>' % en_href)


def read(p):
    return io.open(p, encoding="utf-8").read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, "w", encoding="utf-8", newline="").write(s)


# ---------------------------------------------------------------- English pages
def upgrade_english(path, prefix, dv_href, hreflang_pair):
    s = read(path)
    changed = False
    if 'class="lang-switch"' not in s:
        pat = re.compile(
            r'(    <a href="%ssupport\.html" class="btn btn-ghost nav-cta"[^>]*>Support IKRAM</a>\n)'
            r'(    <button class="burger".*?</button>\n)' % re.escape(prefix), re.S)
        m = pat.search(s)
        if not m:
            print("  !! header pattern not found in", path); return
        block = ('    <div class="nav-tools">\n'
                 '  ' + m.group(1) +
                 '      ' + switch_en(dv_href) + '\n'
                 '  ' + m.group(2) +
                 '    </div>\n')
        s = s[:m.start()] + block + s[m.end():]
        changed = True
    if hreflang_pair and 'hreflang="dv"' not in s.split("</head>")[0]:
        en_url, dv_url = hreflang_pair
        links = ('<link rel="alternate" hreflang="en" href="%s" />\n'
                 '<link rel="alternate" hreflang="dv" href="%s" />\n'
                 '<link rel="alternate" hreflang="x-default" href="%s" />\n' % (en_url, dv_url, en_url))
        s = re.sub(r'(<link rel="canonical"[^>]*/>\n)', r'\1' + links, s, count=1)
        changed = True
    if changed:
        write(path, s); print("  updated", os.path.relpath(path, ROOT))


# ---------------------------------------------------------------- Dhivehi skeletons
def make_dv(page):
    src = os.path.join(ROOT, page + ".html")
    dst = os.path.join(ROOT, "dv", page + ".html")
    if os.path.exists(dst):
        return
    s = read(src)
    en_url = SITE + ("/" if page == "index" else "/%s.html" % page)
    dv_url = SITE + ("/dv/" if page == "index" else "/dv/%s.html" % page)

    s = s.replace('<html lang="en">', '<html lang="dv" dir="rtl">', 1)
    s = s.replace('src="assets/', 'src="../assets/').replace('href="assets/', 'href="../assets/')
    s = s.replace('href="ilm/', 'href="../ilm/')
    s = re.sub(r'<link rel="canonical" href="[^"]*" />', '<link rel="canonical" href="%s" />' % dv_url, s)
    s = re.sub(r'<meta property="og:url" content="[^"]*" />',
               '<meta property="og:url" content="%s" />\n<meta property="og:locale" content="dv_MV" />' % dv_url, s)
    s = re.sub(r'<a class="skip-link" href="([^"]*)">Skip to content</a>', r'<a class="skip-link" href="\1">%s</a>' % SKIP_DV, s)

    # header — rebuilt from the English one (keeps on-dark class + current page)
    hm = re.search(r'<header class="site-header([^"]*)">.*?</header>', s, re.S)
    cur = re.search(r'<li><a href="([a-z/.]+)" aria-current="page">', hm.group(0))
    cur_href = cur.group(1) if cur else None
    lis = []
    for href, label in NAV_DV:
        en_href = href.replace("../", "")
        ac = ' aria-current="page"' if cur_href == en_href else ""
        lis.append('        <li><a href="%s"%s>%s</a></li>' % (href, ac, label))
    sup_ac = ' aria-current="page"' if page == "support" else ""
    lis.append('        <li class="nav-mobile-only"><a href="support.html"%s>%s</a></li>' % (sup_ac, SUPPORT_DV))
    en_back = "../index.html" if page == "index" else "../%s.html" % page
    header = ('<header class="site-header%s">\n'
              '  <div class="wrap nav">\n'
              '    <a class="brand" href="index.html" aria-label="އިކްރާމް — މައި ޞަފްޙާ"><img class="logo logo-terra" src="../assets/img/logos/ikram-logo-maroon.svg" alt="IKRAM" width="80" height="60" /><img class="logo logo-cream" src="../assets/img/logos/ikram-logo-cream.svg" alt="IKRAM" width="80" height="60" /></a>\n'
              '    <nav>\n'
              '      <ul class="nav-links" id="site-nav">\n' + "\n".join(lis) + '\n'
              '      </ul>\n'
              '    </nav>\n'
              '    <div class="nav-tools">\n'
              '      <a href="support.html" class="btn btn-ghost nav-cta"%s>%s</a>\n'
              '      %s\n'
              '      <button class="burger" aria-label="%s" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>\n'
              '    </div>\n'
              '  </div>\n'
              '</header>') % (hm.group(1), sup_ac, SUPPORT_DV, switch_dv(en_back), MENU_DV)
    s = s[:hm.start()] + header + s[hm.end():]

    # footer
    fm = re.search(r'<footer class="site-footer">.*?</footer>', s, re.S)
    s = s[:fm.start()] + FOOTER_DV + s[fm.end():]

    # untranslated content blocks stay left-to-right English until their phase
    s = re.sub(r'^<section(?![^>]*\bdir=)', '<section lang="en" dir="ltr" data-dv="pending"', s, flags=re.M)
    s = re.sub(r'^<div class="q-player"', '<div lang="en" dir="ltr" data-dv="pending" class="q-player"', s, flags=re.M)
    write(dst, s)
    print("  created dv/%s.html" % page)


def main():
    print("English pages:")
    for page in PAGES:
        path = os.path.join(ROOT, page + ".html")
        if not os.path.exists(path):
            print("  (missing)", page); continue
        en_url = SITE + ("/" if page == "index" else "/%s.html" % page)
        dv_url = SITE + ("/dv/" if page == "index" else "/dv/%s.html" % page)
        upgrade_english(path, "", "dv/%s.html" % page, (en_url, dv_url))
    for rel in ILM:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            continue
        depth = rel.count("/")
        prefix = "../" * depth
        upgrade_english(path, prefix, prefix + "dv/index.html", None)
    print("Dhivehi skeletons:")
    for page in PAGES:
        if os.path.exists(os.path.join(ROOT, page + ".html")):
            make_dv(page)


if __name__ == "__main__":
    main()
