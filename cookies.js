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
    if (level === 'all') {
        loadGoatCounter();
        loadAdSense();
    }

    if (level === 'essential') {
        loadGoatCounter();
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
}

function loadAdSense() {
    if (window.adsbygoogleLoaded) return;

    const s = document.createElement('script');
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    s.setAttribute("data-ad-client", "ca-pub-XXXXXXXXXXXXXXX");
    document.head.appendChild(s);

    window.adsbygoogleLoaded = true;
}
