/**
 * ratgeber.js – Lernolotl Ratgeber-Box
 * Injiziert automatisch eine klickbare Etsy-Box passend zur Geschichte.
 * Einbindung: <script src="../ratgeber.js"></script>
 *
 * Keywords basieren auf echten Dateinamen aus der Sitemap (Stand 21.03.2026)
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

    // ── FREUNDE (11–23) – exakte Dateinamen aus Sitemap ──────────────────────
    {
      titel: "Ratgeber #11 – Erster Besuch",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/11.jpg",
      etsy: "https://www.etsy.com/de/listing/4475458896/kinder-pdf-ratgeber-nr11-zum-ersten-mal",
      urls: ["freunde-geschichte-1-besuch"]
    },
    {
      titel: "Ratgeber #12 – Streit",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/12.jpg",
      etsy: "https://www.etsy.com/de/listing/4475459912/wut-bei-kindern-pdf-ratgeber-nr-12o",
      urls: ["freunde-geschichte-2-streit"]
    },
    {
      titel: "Ratgeber #13 – Besuch von Oma",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/13.jpg",
      etsy: "https://www.etsy.com/de/listing/4475454687/besuch-von-oma-pdf-ratgeber-nr-13o",
      urls: ["freunde-geschichte-3-oma"]
    },
    {
      titel: "Ratgeber #14 – Bester Freund",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/14.jpg",
      etsy: "https://www.etsy.com/de/listing/4475461670/ablehnung-durch-freunde-kinder-pdf",
      urls: ["freunde-geschichte-4-1-bester-freund"]
    },
    {
      titel: "Ratgeber #15 – Spielregeln",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/15.jpg",
      etsy: "https://www.etsy.com/de/listing/4475462396/freundschaft-endet-kinder-pdf-ratgeber",
      urls: ["freunde-geschichte-4-2-spielregeln"]
    },
    {
      titel: "Ratgeber #16 – Empathie",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/16.jpg",
      etsy: "https://www.etsy.com/de/listing/4475457321/spielregeln-kinder-pdf-ratgeber-nr-17",
      urls: ["freunde-geschichte-4-4-empathie"]
    },
    {
      titel: "Ratgeber #17 – Einladung",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/17.jpg",
      etsy: "https://www.etsy.com/de/listing/4475465020/empathie-kinder-pdf-ratgeber-nr-17o",
      urls: ["freunde-geschichte-4-5-einladung"]
    },
    {
      titel: "Ratgeber #18 – Alleine sein",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/18.jpg",
      etsy: "https://www.etsy.com/de/listing/4475466404/einladung-ablehnen-kinder-pdf-ratgeber",
      urls: ["freunde-geschichte-4-6-alleine"]
    },
    {
      titel: "Ratgeber #19 – Anders sein",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/19.jpg",
      etsy: "https://www.etsy.com/de/listing/4475460821/mobbing-kinder-pdf-ratgeber-nr-19",
      urls: ["freunde-geschichte-4-7-anders"]
    },
    {
      titel: "Ratgeber #20 – Geheimnisse",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/20.jpg",
      etsy: "https://www.etsy.com/de/listing/4475461337/alleine-sein-wollen-kinder-pdf-ratgeber",
      urls: ["freunde-geschichte-4-8-geheimnis"]
    },
    {
      titel: "Ratgeber #21 – Streit & Versöhnung",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/21.jpg",
      etsy: "https://www.etsy.com/de/listing/4475462253/neue-freundschaft-kinder-pdf-ratgeber-nr",
      urls: ["freunde-geschichte-4-9-streit"]
    },
    {
      titel: "Ratgeber #22 – Freundschaft endet",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/22.jpg",
      etsy: "https://www.etsy.com/de/listing/4475462657/gute-schlechte-geheimnisse-kinder-pdf",
      urls: ["freunde-geschichte-4-10-ende"]
    },
    {
      titel: "Ratgeber #23 – Mobbing",
      untertitel: "Freunde · PDF",
      bild: "ratgeberbilder/23.jpg",
      etsy: "https://www.etsy.com/de/listing/4475463145/streit-versohnung-kinder-pdf-ratgeber-nr",
      urls: ["freunde-geschichte-mobbing"]
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
    // Absoluter Pfad vom Root – funktioniert auf jeder Unterseite
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

    // MITTE: nach dem 1. .ad-container, sonst nach dem 1. .story-section
    const adContainers = document.querySelectorAll(".ad-container");
    const storySections = document.querySelectorAll(".story-section");

    const midTarget = adContainers.length >= 1
      ? adContainers[0]
      : (storySections.length >= 1 ? storySections[0] : null);

    if (midTarget) {
      midTarget.insertAdjacentHTML("afterend", buildBox(ratgeber, "mitte"));
    }

    // ENDE: direkt vor dem <footer>
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
