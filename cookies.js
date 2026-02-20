/* =====================================
   Cookie Consent Management
   DSGVO / TTDSG konform
   ===================================== */
(function () {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        showBanner();
    } else {
        applyConsent(consent);
    }
})();

function showBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.classList.add('show');
    }
}

function hideBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) {
        banner.classList.remove('show');
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'all');
    applyConsent('all');
    hideBanner();
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'essential');
    applyConsent('essential');
    hideBanner();
}

function applyConsent(level) {
    // GoatCounter lädt immer (anonym, technisch notwendig)
    loadGoatCounter();

    // AdSense NUR bei ausdrücklicher Zustimmung
    if (level === 'all') {
        loadAdSense();
    }
}

/* =====================
   Tracking & Werbung
   ===================== */
function loadGoatCounter() {
    if (window.goatcounterLoaded) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://pauleheissta.goatcounter.com/count");
    document.head.appendChild(s);
    window.goatcounterLoaded = true;
    console.log('✓ GoatCounter geladen (anonym)');
}

function loadAdSense() {
    if (window.adsbygoogleLoaded) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    s.setAttribute("data-ad-client", "ca-pub-XXXXXXXXXXXXXXX"); // ← IHRE AdSense ID HIER EINTRAGEN!
    s.setAttribute("crossorigin", "anonymous");
    document.head.appendChild(s);
    window.adsbygoogleLoaded = true;
    console.log('✓ Google AdSense geladen (mit Einwilligung)');
}

/* =====================
   Optional: Consent zurücksetzen für Tests
   ===================== */
// Im Browser-Console aufrufen: resetConsent()
function resetConsent() {
    localStorage.removeItem('cookieConsent');
    location.reload();
}

/* =====================================
   Bundle Auto-Injection
   Erscheint nach der Gesprächsanregung-Box
   nur auf Gefühlsgeschichten-Seiten,
   nur wenn kein Bundle bereits eingebaut ist
   ===================================== */
document.addEventListener('DOMContentLoaded', function () {

    // Nur auf Gefühlsgeschichten-Seiten
    const istGefuehlsseite = window.location.pathname.match(
        /angst|wut|traurigkeit|freude|einsamkeit|dankbarkeit|eifersucht|unsicherheit|mut|geduld|frustration/
    );

    // Nur wenn Bundle noch NICHT im HTML vorhanden
    const bundleBereitsVorhanden = document.getElementById('bundle-auswahl');

    if (istGefuehlsseite && !bundleBereitsVorhanden) {

        const bundleHTML = `
        <div id="bundle-auswahl" style="
            background: linear-gradient(160deg, #1a1a2e 0%, #0f3460 100%);
            border-radius: 25px;
            padding: 40px;
            margin: 40px 0;
            box-shadow: 0 15px 40px rgba(0,0,0,0.25);
            position: relative;
            overflow: hidden;
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        ">
            <div style="text-align:center; margin-bottom: 25px; position: relative; z-index: 1;">
                <div style="
                    display: inline-block;
                    background: rgba(240,147,251,0.15);
                    border: 1px solid rgba(240,147,251,0.3);
                    color: #f093fb;
                    font-size: 0.78em;
                    font-weight: 700;
                    padding: 5px 16px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 14px;
                ">🌟 Komplettpaket · Alle 11 Gefühle</div>
                <div style="
                    color: white;
                    font-size: 1.45em;
                    font-weight: 800;
                    line-height: 1.3;
                    margin-bottom: 10px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                ">Diese Geschichte gefällt dir?<br>
                <span style="background: linear-gradient(135deg,#f093fb,#f5576c); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">
                    Alle 11 Gefühle auf einmal
                </span> gibt es als Bundle!</div>
                <p style="color: #94a3b8; font-size: 0.92em; line-height: 1.6; max-width: 540px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    Angst · Freude · Wut · Traurigkeit · Mut · Geduld · Eifersucht · Dankbarkeit · Einsamkeit · Frustration · Unsicherheit — alle pädagogisch aufgearbeitet, inkl. Ausmalbildern & Arbeitsblättern. Einmal kaufen, alles drin.
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; position: relative; z-index: 1; margin-bottom: 18px;">

                <a href="https://www.etsy.com/de/listing/4460309739/gefuhlsgeschichten-kita-alle-11"
                   target="_blank" rel="noopener" style="
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    padding: 22px 18px;
                    text-align: center;
                    text-decoration: none;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                " onmouseover="this.style.background='rgba(255,255,255,0.11)'; this.style.transform='translateY(-4px)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)'">
                    <div style="font-size: 2.2em;">🧸</div>
                    <div style="font-size: 0.75em; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Kita · 3–6 Jahre</div>
                    <div style="font-weight: 700; font-size: 0.95em; color: white; line-height: 1.4;">Alle 11 Geschichten<br>Kita-Bundle</div>
                    <div style="background: rgba(102,126,234,0.22); border: 1px solid rgba(102,126,234,0.35); color: #c3cfff; font-size: 0.78em; font-weight: 600; padding: 4px 12px; border-radius: 10px;">11 Pakete · 1 Download</div>
                    <div style="margin-top: 4px; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color: white; padding: 11px 16px; border-radius: 11px; font-weight: 700; font-size: 0.87em; width: 100%; box-sizing: border-box;">Jetzt Bundle holen →</div>
                </a>

                <a href="https://www.etsy.com/de/listing/4460310667/gefuhlsgeschichten-grundschule-klasse-12"
                   target="_blank" rel="noopener" style="
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    padding: 22px 18px;
                    text-align: center;
                    text-decoration: none;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                " onmouseover="this.style.background='rgba(255,255,255,0.11)'; this.style.transform='translateY(-4px)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)'">
                    <div style="font-size: 2.2em;">✏️</div>
                    <div style="font-size: 0.75em; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Klasse 1 & 2</div>
                    <div style="font-weight: 700; font-size: 0.95em; color: white; line-height: 1.4;">Alle 11 Geschichten<br>Klasse 1/2 Bundle</div>
                    <div style="background: rgba(102,126,234,0.22); border: 1px solid rgba(102,126,234,0.35); color: #c3cfff; font-size: 0.78em; font-weight: 600; padding: 4px 12px; border-radius: 10px;">11 Pakete · 1 Download</div>
                    <div style="margin-top: 4px; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color: white; padding: 11px 16px; border-radius: 11px; font-weight: 700; font-size: 0.87em; width: 100%; box-sizing: border-box;">Jetzt Bundle holen →</div>
                </a>

                <a href="https://www.etsy.com/de/listing/4460318214/gefuhlsgeschichten-grundschule-klasse-34"
                   target="_blank" rel="noopener" style="
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 18px;
                    padding: 22px 18px;
                    text-align: center;
                    text-decoration: none;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                " onmouseover="this.style.background='rgba(255,255,255,0.11)'; this.style.transform='translateY(-4px)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.06)'; this.style.transform='translateY(0)'">
                    <div style="font-size: 2.2em;">📖</div>
                    <div style="font-size: 0.75em; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Klasse 3 & 4</div>
                    <div style="font-weight: 700; font-size: 0.95em; color: white; line-height: 1.4;">Alle 11 Geschichten<br>Klasse 3/4 Bundle</div>
                    <div style="background: rgba(102,126,234,0.22); border: 1px solid rgba(102,126,234,0.35); color: #c3cfff; font-size: 0.78em; font-weight: 600; padding: 4px 12px; border-radius: 10px;">11 Pakete · 1 Download</div>
                    <div style="margin-top: 4px; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color: white; padding: 11px 16px; border-radius: 11px; font-weight: 700; font-size: 0.87em; width: 100%; box-sizing: border-box;">Jetzt Bundle holen →</div>
                </a>

            </div>

            <p style="text-align: center; color: #64748b; font-size: 0.82em; position: relative; z-index: 1; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <span style="color: #4ade80; font-weight: 600;">✅ Sofort-Download als PDF</span> &nbsp;·&nbsp; Einmal kaufen, dauerhaft nutzen
            </p>
        </div>`;

        // Scroll-Observer auf die Info-Box (Gesprächsanregung)
        const infoBox = document.querySelector('.info-box');

        if (infoBox) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Bundle nach der Info-Box einfügen
                        infoBox.insertAdjacentHTML('afterend', bundleHTML);

                        // Sanfte Einblend-Animation
                        setTimeout(() => {
                            const bundle = document.getElementById('bundle-auswahl');
                            if (bundle) {
                                bundle.style.opacity = '1';
                                bundle.style.transform = 'translateY(0)';
                            }
                        }, 100);

                        observer.disconnect(); // Nur einmal ausführen
                    }
                });
            }, { threshold: 0.9 }); // 90% der Box muss sichtbar sein

            observer.observe(infoBox);
        }
    }
});

/* =====================================
   Footer Injection
   Footer in HTML-Seiten kann entfernt
   werden – wird hier automatisch gesetzt
   ===================================== */
document.addEventListener('DOMContentLoaded', function () {
    const footerHTML = `
        <footer>
            <p class="footer-brand">Der Lernolotl</p>
            <p class="footer-tagline">Pädagogisch aufgewertete Vorlesegeschichten</p>

            <div class="footer-links">
                <a href="impressum.html">Impressum</a>
                <a href="datenschutz.html">Datenschutz</a>
                <a href="cookie-richtlinie.html">Cookie-Richtlinie</a>
                <a href="kontakt.html">Kontakt</a>
                <a href="ueber-uns.html">Über uns</a>
            </div>

            <div class="footer-info">
                <p style="margin-top: 15px; font-size: 0.85em;">© 2026 Der Lernolotl – Alle Rechte vorbehalten</p>
            </div>
        </footer>
    `;

    // Vorhandenen statischen Footer ersetzen
    const existingFooter = document.querySelector('footer');
    if (existingFooter) {
        existingFooter.outerHTML = footerHTML;
    } else {
        // Fallback: ans Ende von .container hängen
        const container = document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('beforeend', footerHTML);
        }
    }
});
