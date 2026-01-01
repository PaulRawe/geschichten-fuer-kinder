// PayPal Spenden-Button automatisch einfügen
document.addEventListener('DOMContentLoaded', function() {
    // Finde den Footer (das Element VOR dem der Button eingefügt werden soll)
    const footer = document.querySelector('footer');
    
    if (footer) {
        // Erstelle den Spenden-Container
        const spendenContainer = document.createElement('div');
        spendenContainer.className = 'paypal-spenden-container';
        
        spendenContainer.innerHTML = `
            <div class="spenden-box">
                <div class="spenden-header">
                    <div class="spenden-emoji">❤️</div>
                    <h3 class="spenden-titel">Hat dir die Geschichte gefallen?</h3>
                    <p class="spenden-text">
                        Diese Geschichten sind und bleiben kostenlos. Wenn du meine Arbeit unterstützen möchtest, 
                        freue ich mich über eine kleine Spende – schon 3€ helfen mir, weiterhin zauberhafte 
                        Geschichten zu schreiben! ☕
                    </p>
                </div>
                
                <div class="spenden-buttons">
                    <a href="https://paypal.me/Vorlesegeschichten/3" 
                       class="paypal-btn paypal-btn-small" 
                       target="_blank" 
                       rel="noopener noreferrer">
                        <span class="btn-icon">☕</span>
                        <span class="btn-text">3€ Spenden</span>
                    </a>
                    <a href="https://paypal.me/Vorlesegeschichten/5" 
                       class="paypal-btn paypal-btn-medium" 
                       target="_blank" 
                       rel="noopener noreferrer">
                        <span class="btn-icon">💝</span>
                        <span class="btn-text">5€ Spenden</span>
                    </a>
                    <a href="https://paypal.me/Vorlesegeschichten" 
                       class="paypal-btn paypal-btn-custom" 
                       target="_blank" 
                       rel="noopener noreferrer">
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">Eigener Betrag</span>
                    </a>
                </div>
                
                <div class="spenden-hinweis">
                    <p>
                        <small>
                            💚 100% freiwillig • Keine Verpflichtung • Alle Geschichten bleiben kostenlos
                        </small>
                    </p>
                </div>
                
                <div class="spenden-datenschutz">
                    <p>
                        <small>
                            <strong>Datenschutzhinweis:</strong> Durch Klick auf den Spendenbutton wirst du zu PayPal weitergeleitet. 
                            Es gelten die <a href="datenschutz.html">Datenschutzbestimmungen</a> von PayPal und unsere Website.
                        </small>
                    </p>
                </div>
            </div>
        `;
        
        // Füge den Container VOR dem Footer ein
        footer.parentNode.insertBefore(spendenContainer, footer);
    }
});
