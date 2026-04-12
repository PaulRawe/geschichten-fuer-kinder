/**
 * ratgeber.js – Lernolotl Ratgeber-Box
 * Injiziert automatisch eine klickbare Etsy-Box passend zur Geschichte.
 * Einbindung: <script src="../ratgeber.js"></script>
 *
 * Keywords basieren auf echten Dateinamen aus der Sitemap (Stand 12.04.2026)
 */

(function () {

  // ── 1. DATEN ────────────────────────────────────────────────────────────────

  const RATGEBER = [

    // ── KITA (1–10) ──────────────────────────────────────────────────────────
    {
      titel: "Wenn es zu laut wird",
      untertitel: "Ratgeber #1 · Kita · PDF",
      bild: "ratgeberbilder/1.jpg",
      etsy: "https://www.etsy.com/de/listing/4474636785/lernolotl-ratgeber-1-wenn-es-zu-laut",
      urls: ["kita-geschichte-1-morgenkreis"]
    },
    {
      titel: "Darf ich mitspielen?",
      untertitel: "Ratgeber #2 · Kita · PDF",
      bild: "ratgeberbilder/2.jpg",
      etsy: "https://www.etsy.com/de/listing/4474646274/lernolotl-ratgeber-2-darf-ich-mitspielen",
      urls: ["kita-geschichte-2-spielplatz"]
    },
    {
      titel: "Wenn Mama geht",
      untertitel: "Ratgeber #3 · Kita · PDF",
      bild: "ratgeberbilder/3.jpg",
      etsy: "https://www.etsy.com/de/listing/4474640643/lernolotl-ratgeber-3-wenn-mama-geht-o",
      urls: ["kita-geschichte-3-verabschiedung"]
    },
    {
      titel: "Wenn Wut zur Welle wird",
      untertitel: "Ratgeber #4 · Kita · PDF",
      bild: "ratgeberbilder/4.jpg",
      etsy: "https://www.etsy.com/de/listing/4474649738/lernolotl-ratgeber-4-wenn-der-plan-sich",
      urls: ["kita-geschichte-4-plan"]
    },
    {
      titel: "Das gehört doch mir!",
      untertitel: "Ratgeber #5 · Kita · PDF",
      bild: "ratgeberbilder/5.jpg",
      etsy: "https://www.etsy.com/de/listing/4474651476/lernolotl-ratgeber-5-das-gehort-doch-mir",
      urls: ["kita-geschichte-5-teilen"]
    },
    {
      titel: "Wie sagt man Hallo?",
      untertitel: "Ratgeber #6 · Kita · PDF",
      bild: "ratgeberbilder/6.jpg",
      etsy: "https://www.etsy.com/de/listing/4474645779/lernolotl-ratgeber-6-wie-sagt-man-hallo",
      urls: ["kita-geschichte-6-hallo-sagen"]
    },
    {
      titel: "Ich esse das nicht!",
      untertitel: "Ratgeber #7 · Kita · PDF",
      bild: "ratgeberbilder/7.jpg",
      etsy: "https://www.etsy.com/de/listing/4474647347/lernolotl-ratgeber-7-ich-esse-das-nicht",
      urls: ["kita-geschichte-7-essen"]
    },
    {
      titel: "Ich weine und weiß nicht warum",
      untertitel: "Ratgeber #8 · Kita · PDF",
      bild: "ratgeberbilder/8.jpg",
      etsy: "https://www.etsy.com/de/listing/4474749273/lernolotl-ratgeber-8-ich-weine-und-weiss",
      urls: ["kita-geschichte-8-weinen"]
    },
    {
      titel: "Ich will nicht!",
      untertitel: "Ratgeber #9 · Kita · PDF",
      bild: "ratgeberbilder/9.png",
      etsy: "https://www.etsy.com/de/listing/4474750349/lernolotl-ratgeber-9-ich-will-nicht",
      urls: ["kita-geschichte-9-schlafen"]
    },
    {
      titel: "Tschüss Kita!",
      untertitel: "Ratgeber #10 · Kita · PDF",
      bild: "ratgeberbilder/10.jpg",
      etsy: "https://www.etsy.com/de/listing/4474751387/lernolotl-ratgeber-10-tschuss-kita-o",
      urls: ["kita-geschichte-10-abschied-kita"]
    },

    // ── FREUNDE (11–23) ───────────────────────────────────────────────────────
    {
      titel: "Ratgeber #11",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/11.jpg",
      etsy: "https://www.etsy.com/de/listing/4475458896/kinder-pdf-ratgeber-nr11-zum-ersten-mal",
      urls: ["freunde-geschichte-1-besuch"]
    },
    {
      titel: "Ratgeber #12",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/12.jpg",
      etsy: "https://www.etsy.com/de/listing/4475459912/wut-bei-kindern-pdf-ratgeber-nr-12o",
      urls: ["freunde-geschichte-2-streit"]
    },
    {
      titel: "Ratgeber #13",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/13.jpg",
      etsy: "https://www.etsy.com/de/listing/4475454687/besuch-von-oma-pdf-ratgeber-nr-13o",
      urls: ["freunde-geschichte-3-oma"]
    },
    {
      titel: "Ratgeber #19",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/19.jpg",
      etsy: "https://www.etsy.com/de/listing/4475460821/mobbing-kinder-pdf-ratgeber-nr-19",
      urls: ["freunde-geschichte-mobbing"]
    },
    {
      titel: "Ratgeber #14",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/14.jpg",
      etsy: "https://www.etsy.com/de/listing/4475461670/ablehnung-durch-freunde-kinder-pdf",
      urls: ["freunde-geschichte-4-1-bester-freund"]
    },
    {
      titel: "Ratgeber #16",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/16.jpg",
      etsy: "https://www.etsy.com/de/listing/4475457321/spielregeln-kinder-pdf-ratgeber-nr-17",
      urls: ["freunde-geschichte-4-2-spielregeln"]
    },
    {
      titel: "Ratgeber #17",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/17.jpg",
      etsy: "https://www.etsy.com/de/listing/4475465020/empathie-kinder-pdf-ratgeber-nr-17o",
      urls: ["freunde-geschichte-4-4-empathie"]
    },
    {
      titel: "Ratgeber #18",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/18.jpg",
      etsy: "https://www.etsy.com/de/listing/4475466404/einladung-ablehnen-kinder-pdf-ratgeber",
      urls: ["freunde-geschichte-4-5-einladung"]
    },
    {
      titel: "Ratgeber #20",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/20.jpg",
      etsy: "https://www.etsy.com/de/listing/4475461337/alleine-sein-wollen-kinder-pdf-ratgeber",
      urls: ["freunde-geschichte-4-6-alleine"]
    },
    {
      titel: "Ratgeber #21",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/21.jpg",
      etsy: "https://www.etsy.com/de/listing/4475462253/neue-freundschaft-kinder-pdf-ratgeber-nr",
      urls: ["freunde-geschichte-4-7-anders"]
    },
    {
      titel: "Ratgeber #22",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/22.jpg",
      etsy: "https://www.etsy.com/de/listing/4475462657/gute-schlechte-geheimnisse-kinder-pdf",
      urls: ["freunde-geschichte-4-8-geheimnis"]
    },
    {
      titel: "Ratgeber #23",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/23.jpg",
      etsy: "https://www.etsy.com/de/listing/4475463145/streit-versohnung-kinder-pdf-ratgeber-nr",
      urls: ["freunde-geschichte-4-9-streit"]
    },
    {
      titel: "Ratgeber #15",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/15.jpg",
      etsy: "https://www.etsy.com/de/listing/4475462396/freundschaft-endet-kinder-pdf-ratgeber",
      urls: ["freunde-geschichte-4-10-ende"]
    },

    // ── ICH BIN ICH (24–33) ───────────────────────────────────────────────────
    {
      titel: "Ich bin anders – und das ist okay",
      untertitel: "Ratgeber #24 · Ich bin ich · PDF",
      bild: "ratgeberbilder/24.jpg",
      etsy: "https://www.etsy.com/de/listing/4477424820/ich-bin-anders-vorlesegeschichte",
      urls: ["ichbinich-geschichte-anders"]
    },
    {
      titel: "Angst – das komische Gefühl im Bauch",
      untertitel: "Ratgeber #25 · Ich bin ich · PDF",
      bild: "ratgeberbilder/25.jpg",
      etsy: "https://www.etsy.com/de/listing/4477418017/angst-bei-kindern-vorlesegeschichte",
      urls: ["ichbinich-geschichte-angst"]
    },
    {
      titel: "Dankbarkeit – die kleinen Dinge sehen",
      untertitel: "Ratgeber #26 · Ich bin ich · PDF",
      bild: "ratgeberbilder/26.jpg",
      etsy: "https://www.etsy.com/de/listing/4477426162/dankbarkeit-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-dankbarkeit"]
    },
    {
      titel: "Ich weiß nicht, wer ich bin – auf der Suche",
      untertitel: "Ratgeber #27 · Ich bin ich · PDF",
      bild: "ratgeberbilder/27.jpg",
      etsy: "https://www.etsy.com/de/listing/4477419533/identitat-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-identitaet"]
    },
    {
      titel: "Langeweile – und plötzlich kommt eine Idee",
      untertitel: "Ratgeber #28 · Ich bin ich · PDF",
      bild: "ratgeberbilder/28.jpg",
      etsy: "https://www.etsy.com/de/listing/4477420779/langeweile-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-langeweile"]
    },
    {
      titel: "Nein sagen – ich darf meine Grenzen schützen",
      untertitel: "Ratgeber #29 · Ich bin ich · PDF",
      bild: "ratgeberbilder/29.jpg",
      etsy: "https://www.etsy.com/de/listing/4477421307/nein-sagen-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-neinsagen"]
    },
    {
      titel: "Perfekt sein müssen – warum reicht es nie?",
      untertitel: "Ratgeber #30 · Ich bin ich · PDF",
      bild: "ratgeberbilder/30.jpg",
      etsy: "https://www.etsy.com/de/listing/4477429308/perfektionismus-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-perfekt"]
    },
    {
      titel: "In was bin ich gut? Meine Superkräfte",
      untertitel: "Ratgeber #31 · Ich bin ich · PDF",
      bild: "ratgeberbilder/31.jpg",
      etsy: "https://www.etsy.com/de/listing/4477422355/starken-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-superkraefte"]
    },
    {
      titel: "Wenn ich traurig bin – Traurigkeit ist kein Fehler",
      untertitel: "Ratgeber #32 · Ich bin ich · PDF",
      bild: "ratgeberbilder/32.jpg",
      etsy: "https://www.etsy.com/de/listing/4477430464/traurigkeit-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-traurigkeit"]
    },
    {
      titel: "Was kommt nach der Schule? Träume und Pläne",
      untertitel: "Ratgeber #33 · Ich bin ich · PDF",
      bild: "ratgeberbilder/33.jpg",
      etsy: "https://www.etsy.com/de/listing/4477431000/berufswunsche-kinder-vorlesegeschichte",
      urls: ["ichbinich-geschichte-zukunft"]
    },

    // ── SPORT (34–43) ─────────────────────────────────────────────────────────
    {
      titel: "Ratgeber #34",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/34.jpg",
      etsy: "https://www.etsy.com/de/listing/4479575310/schwimmen-lernen-vorlesegeschichte",
      urls: ["sport-geschichte-1-schwimmen"]
    },
    {
      titel: "Ratgeber #35",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/35.jpg",
      etsy: "https://www.etsy.com/de/listing/4479575666/verlieren-lernen-vorlesegeschichte",
      urls: ["sport-geschichte-2-verlieren"]
    },
    {
      titel: "Ratgeber #36",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/36.jpg",
      etsy: "https://www.etsy.com/de/listing/4479568735/teamarbeit-kinder-vorlesegeschichte",
      urls: ["sport-geschichte-3-teamarbeit"]
    },
    {
      titel: "Ratgeber #37",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/37.jpg",
      etsy: "https://www.etsy.com/de/listing/4479576432/langsam-im-sport-vorlesegeschichte",
      urls: ["sport-geschichte-4-langsam"]
    },
    {
      titel: "Ratgeber #38",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/38.jpg",
      etsy: "https://www.etsy.com/de/listing/4479576832/ungeschriebene-regeln-vorlesegeschichte",
      urls: ["sport-geschichte-5-regeln"]
    },
    {
      titel: "Ratgeber #39",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/39.jpg",
      etsy: "https://www.etsy.com/de/listing/4479577174/uberforderung-sport-vorlesegeschichte",
      urls: ["sport-geschichte-6-ueberforderung"]
    },
    {
      titel: "Ratgeber #40",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/40.jpg",
      etsy: "https://www.etsy.com/de/listing/4479577508/aufhoren-wollen-kinder-vorlesegeschichte",
      urls: ["sport-geschichte-7-aufhoeren"]
    },
    {
      titel: "Ratgeber #41",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/41.jpg",
      etsy: "https://www.etsy.com/de/listing/4479577852/gewinnen-mit-empathie-vorlesegeschichte",
      urls: ["sport-geschichte-8-gewinnen"]
    },
    {
      titel: "Ratgeber #42",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/42.jpg",
      etsy: "https://www.etsy.com/de/listing/4479570753/ausgrenzung-im-sport-vorlesegeschichte",
      urls: ["sport-geschichte-9-ausgrenzung"]
    },
    {
      titel: "Ratgeber #43",
      untertitel: "Sport · PDF",
      bild: "ratgeberbilder/43.jpg",
      etsy: "https://www.etsy.com/de/listing/4479578454/fahrrad-lernen-kinder-vorlesegeschichte",
      urls: ["sport-geschichte-10-fahrrad"]
    },

    // ── SCHULE (44–53) ────────────────────────────────────────────────────────
    {
      titel: "Ratgeber #44",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/44.jpg",
      etsy: "https://www.etsy.com/de/listing/4483503587/lernolotl-meldet-sich-ratgeber-nr44-mut",
      urls: ["schule-geschichte-1-melden"]
    },
    {
      titel: "Ratgeber #45",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/45.jpg",
      etsy: "https://www.etsy.com/de/listing/4483508824/was-macht-man-in-der-pause-ratgeber-nr45",
      urls: ["schule-geschichte-2-pause"]
    },
    {
      titel: "Ratgeber #46",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/46.jpg",
      etsy: "https://www.etsy.com/de/listing/4483509208/der-rote-stift-ratgeber-nr46",
      urls: ["schule-geschichte-3-roter-stift"]
    },
    {
      titel: "Ratgeber #47",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/47.jpg",
      etsy: "https://www.etsy.com/de/listing/4483504949/hausaufgaben-die-grosse-katastrophe-o",
      urls: ["schule-geschichte-4-hausaufgaben"]
    },
    {
      titel: "Ratgeber #48",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/48.jpg",
      etsy: "https://www.etsy.com/de/listing/4483510188/springender-kopf-ratgeber-nr48",
      urls: ["schule-geschichte-5-springender-kopf"]
    },
    {
      titel: "Ratgeber #49",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/49.jpg",
      etsy: "https://www.etsy.com/de/listing/4483510570/prufungsangst-wenn-der-kopf-leer-wird-o",
      urls: ["schule-geschichte-6-pruefungsangst"]
    },
    {
      titel: "Ratgeber #50",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/50.jpg",
      etsy: "https://www.etsy.com/de/listing/4483506185/wenn-es-zu-laut-wird-ratgeber-nr50",
      urls: ["schule-geschichte-7-laut"]
    },
    {
      titel: "Ratgeber #51",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/51.jpg",
      etsy: "https://www.etsy.com/de/listing/4483506645/nach-dem-streit-ratgeber-nr51",
      urls: ["schule-geschichte-8-streit"]
    },
    {
      titel: "Ratgeber #52",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/52.jpg",
      etsy: "https://www.etsy.com/de/listing/4483511676/gruppenarbeit-ich-will-es-alleine-machen",
      urls: ["schule-geschichte-9-gruppenarbeit"]
    },
    {
      titel: "Ratgeber #53",
      untertitel: "Schule · PDF",
      bild: "ratgeberbilder/53.jpg",
      etsy: "https://www.etsy.com/de/listing/4483507465/klassenfahrt-ich-will-nicht-weg-von",
      urls: ["schule-geschichte-10-klassenfahrt"]
    },

    // ── ZUHAUSE (54–65) ───────────────────────────────────────────────────────
    {
      titel: "Ratgeber #54",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/54.jpg",
      etsy: "https://www.etsy.com/de/listing/4487112145/der-abend-der-nicht-klappt-ratgeber-nr54",
      urls: ["zuhause-geschichte-1-abend"]
    },
    {
      titel: "Ratgeber #55",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/55.jpg",
      etsy: "https://www.etsy.com/de/listing/4487120082/wenn-der-akku-leer-ist-o-ratgeber-nr55",
      urls: ["zuhause-geschichte-2-akku"]
    },
    {
      titel: "Ratgeber #56",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/56.jpg",
      etsy: "https://www.etsy.com/de/listing/4487120814/das-zimmer-des-lernolotl-o-ratgeber-nr56",
      urls: ["zuhause-geschichte-3-zimmer"]
    },
    {
      titel: "Ratgeber #57",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/57.jpg",
      etsy: "https://www.etsy.com/de/listing/4487113949/ich-kann-nicht-einschlafen-ratgeber-nr57",
      urls: ["zuhause-geschichte-4-einschlafen"]
    },
    {
      titel: "Ratgeber #58",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/58.jpg",
      etsy: "https://www.etsy.com/de/listing/4487121912/wut-wenn-alles-zu-viel-wird-o-ratgeber",
      urls: ["zuhause-geschichte-5-wut"]
    },
    {
      titel: "Ratgeber #59",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/59.jpg",
      etsy: "https://www.etsy.com/de/listing/4487122448/aufraumen-das-ewige-streitthema-o",
      urls: ["zuhause-geschichte-6-aufraumen"]
    },
    {
      titel: "Ratgeber #60",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/60.jpg",
      etsy: "https://www.etsy.com/de/listing/4487122972/geschwisterstreit-warum-ist-das",
      urls: ["zuhause-geschichte-7-geschwister"]
    },
    {
      titel: "Ratgeber #61",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/61.jpg",
      etsy: "https://www.etsy.com/de/listing/4487115925/bildschirmzeit-wann-ist-schluss-o",
      urls: ["zuhause-geschichte-8-bildschirmzeit"]
    },
    {
      titel: "Ratgeber #62",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/62.jpg",
      etsy: "https://www.etsy.com/de/listing/4487123804/wenn-die-eltern-streiten-ratgeber-nr62",
      urls: ["zuhause-geschichte-9-eltern-streit"]
    },
    {
      titel: "Ratgeber #63",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/63.jpg",
      etsy: "https://www.etsy.com/de/listing/4487116921/haustier-verantwortung-lernen-o-ratgeber",
      urls: ["zuhause-geschichte-10-haustier"]
    },
    {
      titel: "Ratgeber #64",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/64.jpg",
      etsy: "https://www.etsy.com/de/listing/4487124950/krank-sein-ich-will-nicht-pausieren-o",
      urls: ["zuhause-geschichte-11-krank"]
    },
    {
      titel: "Ratgeber #65",
      untertitel: "Zuhause · PDF",
      bild: "ratgeberbilder/65.jpg",
      etsy: "https://www.etsy.com/de/listing/4487117869/kochen-mit-der-familie-ich-will-helfen-o",
      urls: ["zuhause-geschichte-12-kochen"]
    },

    // ── BUNDLES ───────────────────────────────────────────────────────────────
    {
      titel: "Das Kita-Komplettpaket",
      untertitel: "Alle 10 Ratgeber · Bundle · PDF",
      bild: "ratgeberbilder/kita_bundle.jpg",
      etsy: "https://www.etsy.com/de/listing/4474759126/lernolotl-kita-ratgeber-komplett-alle-10",
      urls: ["lernolotls-welt-kita"]
    },
    {
      titel: "Freunde-Reihe Komplettpaket",
      untertitel: "Alle Freunde-Ratgeber · Bundle · PDF",
      bild: "ratgeberbilder/Bundlefreunde.jpg",
      etsy: "https://www.etsy.com/de/listing/4475472110/lernolotl-freunde-reihe-komplettpaket-13",
      urls: ["lernolotls-welt-freunde"]
    },
    {
      titel: "Ich bin ich – Komplettpaket",
      untertitel: "Alle 10 Ratgeber · Bundle · PDF",
      bild: "ratgeberbilder/ichbinichbundle.jpg",
      etsy: "https://www.etsy.com/de/listing/4477424761/ich-bin-ich-komplettpaket-10-ratgeber",
      urls: ["lernolotls-welt-ichbinich", "ichbinich-bundle"]
    },
    {
      titel: "Sport-Reihe Bundle",
      untertitel: "Alle 10 Ratgeber · Bundle · PDF",
      bild: "ratgeberbilder/sportbundle.jpg",
      etsy: "https://www.etsy.com/de/listing/4479579102/sport-reihe-bundle-10-ratgeber-pdf-o",
      urls: ["lernolotls-welt-sport", "sport-bundle"]
    },
    {
      titel: "Schule-Reihe Komplettpaket",
      untertitel: "Alle 10 Ratgeber · Bundle · PDF",
      bild: "ratgeberbilder/bundleschule.jpg",
      etsy: "https://www.etsy.com/de/listing/4483508177/lernolotl-schule-reihe-komplett-10",
      urls: ["lernolotls-welt-schule", "schule-bundle"]
    },
    {
      titel: "Zuhause-Reihe Bundle",
      untertitel: "Alle 12 Ratgeber · Bundle · PDF",
      bild: "ratgeberbilder/zuhausebundle.jpg",
      etsy: "https://www.etsy.com/de/listing/4487119423/zuhause-reihe-komplett-bundle-o",
      urls: ["lernolotls-welt-zuhause", "zuhause-bundle"]
    }
  ];

  // ── 2. PASSENDEN RATGEBER ANHAND DER URL FINDEN ───────────────────────────

  function findRatgeber() {
    const url = window.location.pathname.toLowerCase();
    for (const r of RATGEBER) {
      for (const kw of r.urls) {
        if (url.includes(kw.toLowerCase())) return r;
      }
    }
    return null;
  }

  // ── 3. BOX HTML BAUEN ─────────────────────────────────────────────────────

  function buildBox(ratgeber, position) {
    const bildSrc = "/" + ratgeber.bild;
    const label = position === "mitte" ? "Passend zur Geschichte" : "Passend dazu";

    return `
      <div class="ratgeber-box ratgeber-box--${position}" role="complementary" aria-label="Ratgeber kaufen">
        <a href="${ratgeber.etsy}" target="_blank" rel="noopener" class="ratgeber-box__link">
          <img
            src="${bildSrc}"
            alt="${ratgeber.titel}"
            class="ratgeber-box__img"
            loading="lazy"
            width="80"
            height="80"
          >
          <div class="ratgeber-box__text">
            <span class="ratgeber-box__label">${label}</span>
            <span class="ratgeber-box__titel">${ratgeber.titel}</span>
            <span class="ratgeber-box__sub">${ratgeber.untertitel}</span>
            <span class="ratgeber-box__cta">→ Auf Etsy ansehen</span>
          </div>
        </a>
      </div>`;
  }

  // ── 5. CSS INJIZIEREN ─────────────────────────────────────────────────────

  function injectCSS() {
    if (document.getElementById("ratgeber-box-css")) return;
    const style = document.createElement("style");
    style.id = "ratgeber-box-css";
    style.textContent = `
      .ratgeber-box {
        margin: 32px auto;
        max-width: 520px;
      }
      .ratgeber-box__link {
        display: flex;
        align-items: center;
        gap: 18px;
        background: #fff7ed;
        border: 2px solid #fed7aa;
        border-radius: 18px;
        padding: 16px 20px;
        text-decoration: none;
        color: inherit;
        box-shadow: 0 4px 16px rgba(249,115,22,0.10);
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .ratgeber-box__link:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(249,115,22,0.18);
      }
      .ratgeber-box__img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 10px;
        flex-shrink: 0;
        border: 2px solid #fed7aa;
      }
      .ratgeber-box__text {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .ratgeber-box__label {
        font-size: 0.72em;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #f97316;
      }
      .ratgeber-box__titel {
        font-family: 'Fredoka One', cursive, sans-serif;
        font-size: 1.15em;
        color: #9a3412;
        line-height: 1.2;
      }
      .ratgeber-box__sub {
        font-size: 0.82em;
        color: #c2410c;
        font-weight: 600;
      }
      .ratgeber-box__cta {
        font-size: 0.88em;
        font-weight: 800;
        color: #f97316;
        margin-top: 4px;
      }
      @media (max-width: 480px) {
        .ratgeber-box__img { width: 64px; height: 64px; }
        .ratgeber-box__titel { font-size: 1em; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── 6. BOX AN ZWEI STELLEN EINSETZEN ─────────────────────────────────────

  function inject(ratgeber) {
    injectCSS();

    const adContainers = document.querySelectorAll(".ad-container");
    const storySections = document.querySelectorAll(".story-section");

    const midTarget = adContainers.length >= 1
      ? adContainers[0]
      : (storySections.length >= 1 ? storySections[0] : null);

    if (midTarget) {
      midTarget.insertAdjacentHTML("afterend", buildBox(ratgeber, "mitte"));
    }

    const footer = document.querySelector("footer");
    if (footer) {
      footer.insertAdjacentHTML("beforebegin", buildBox(ratgeber, "ende"));
    }
  }

  // ── 7. START ──────────────────────────────────────────────────────────────

  function init() {
    const ratgeber = findRatgeber();
    if (!ratgeber) return;
    inject(ratgeber);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
