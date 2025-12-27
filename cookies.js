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
