// === MANDI TICKER v4.0 — CLEANED & FIXED ===

let lastKnownPrices = {};
window._mandiAllRates = []; // Global cache for filtering/sorting

// --- FALLBACK DATA (Agar API fail ho jaye) ---
const FALLBACK_RATES = [
    { crop: 'Wheat', price: 2250, prev: 2200, unit: 'qtl', market: 'Lucknow' },
    { crop: 'Rice', price: 3200, prev: 3250, unit: 'qtl', market: 'Lucknow' },
    { crop: 'Tomato', price: 1800, prev: 1500, unit: 'qtl', market: 'Kanpur' },
    { crop: 'Potato', price: 1200, prev: 1150, unit: 'qtl', market: 'Agra' },
    { crop: 'Onion', price: 900, prev: 950, unit: 'qtl', market: 'Nashik' },
    { crop: 'Mustard', price: 5400, prev: 5300, unit: 'qtl', market: 'Meerut' }
];

// --- NORMALIZE JSON DATA ---
function normalizeRates(apiData) {
    if (!apiData) return [];
    if (Array.isArray(apiData)) {
        return apiData.map(item => ({
            crop: item.crop || item.commodity || 'Unknown',
            price: parseFloat(item.modal_price || item.price || 0),
            prev: parseFloat(item.min_price || item.prev_price || item.price || 0),
            market: item.market || item.district || 'Local',
            unit: 'qtl',
            date: item['price date'] || item.price_date || item.date || '',
        })).filter(r => r.crop !== 'Unknown' && r.price > 0);
    }
    return [];
}

// --- TABLE RENDERING (Advanced Version) ---
function renderMandiTable(rates) {
    window._mandiAllRates = rates; // Save for sorting/filtering
    _renderTable(rates);

    // Update 'Last Updated' Label if exists
    const label = document.getElementById('mandi-last-updated');
    if (label) {
        const now = new Date();
        label.textContent = `Updated: ${now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}`;
    }
}

function _renderTable(rates) {
    const tbody = document.getElementById('mandi-tbody');
    if (!tbody) return;

    if (!rates || rates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:32px; color:var(--text-light);">No data available</td></tr>';
        return;
    }

    let html = '';
    rates.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const prev = parseFloat(item.prev) || price;
        const diff = price - prev;
        const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : 0;

        const arrow = diff > 0 ? 'fa-arrow-up' : (diff < 0 ? 'fa-arrow-down' : 'fa-minus');
        const color = diff > 0 ? '#10b981' : (diff < 0 ? '#ef4444' : 'var(--text-light)');
        const diffStr = diff !== 0 ? `${diff > 0 ? '+' : ''}₹${Math.abs(diff).toFixed(0)}` : '—';
        
        // Sparkline Mini-bar Logic
        const barWidth = Math.min(Math.abs(pct) * 5, 100);
        const barColor = diff >= 0 ? '#10b981' : '#ef4444';

        html += `<tr style="border-bottom:1px solid var(--border-color); transition:background 0.2s;"
                    onmouseover="this.style.background='var(--bg-main)'"
                    onmouseout="this.style.background=''">
            <td style="padding:12px 16px;">
                <strong style="font-size:0.95rem;">${item.crop}</strong>
                ${item.market ? `<br><small style="color:var(--text-light); font-size:0.73rem;"><i class="fas fa-map-marker-alt"></i> ${item.market}</small>` : ''}
            </td>
            <td style="padding:12px 16px; text-align:right; color:var(--text-secondary);">
                ₹${prev.toLocaleString('en-IN')}
            </td>
            <td style="padding:12px 16px; text-align:right;">
                <strong style="font-size:1rem;">₹${price.toLocaleString('en-IN')}</strong>
            </td>
            <td style="padding:12px 16px; text-align:center;">
                <span style="color:${color}; font-weight:600; white-space:nowrap;">
                    <i class="fas ${arrow}" style="font-size:0.7rem;"></i>
                    ${diffStr}
                </span>
                ${pct != 0 ? `<br><small style="color:${color}; font-size:0.72rem;">(${pct > 0 ? '+' : ''}${pct}%)</small>` : ''}
            </td>
            <td style="padding:12px 16px; text-align:center; min-width:80px;">
                <div style="height:6px; border-radius:3px; background:var(--bg-main); overflow:hidden; width:70px; margin:0 auto;">
                    <div style="height:100%; width:${barWidth}%; background:${barColor}; border-radius:3px; transition:width 0.5s;"></div>
                </div>
            </td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

// --- SORTING & FILTERING ---
function filterMandiTable(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        _renderTable(window._mandiAllRates);
        return;
    }
    const filtered = window._mandiAllRates.filter(r =>
        r.crop.toLowerCase().includes(q) || (r.market && r.market.toLowerCase().includes(q))
    );
    _renderTable(filtered);
}

function sortMandiTable(by) {
    if (!window._mandiAllRates.length) return;
    let sorted = [...window._mandiAllRates];
    
    if (by === 'name') sorted.sort((a, b) => a.crop.localeCompare(b.crop));
    else if (by === 'price-high') sorted.sort((a, b) => (parseFloat(b.price)||0) - (parseFloat(a.price)||0));
    else if (by === 'price-low') sorted.sort((a, b) => (parseFloat(a.price)||0) - (parseFloat(b.price)||0));
    else if (by === 'change') sorted.sort((a, b) => {
        const da = Math.abs((parseFloat(a.price)||0) - (parseFloat(a.prev)||parseFloat(a.price)||0));
        const db = Math.abs((parseFloat(b.price)||0) - (parseFloat(b.prev)||parseFloat(b.price)||0));
        return db - da;
    });
    
    _renderTable(sorted);
}

// --- TICKER RENDERING ---
function renderMandiTicker(rates) {
    const ticker = document.getElementById('mandi-ticker');
    if (!ticker) return;

    if (!ticker.querySelector('.ticker-inner')) {
        ticker.innerHTML = `
            <div class="ticker-label">📢 <b>Live Mandi</b></div>
            <div class="ticker-track">
                <div class="ticker-inner" id="mandi-ticker-inner"></div>
            </div>`;
    }

    const inner = document.getElementById('mandi-ticker-inner');
    if (!inner) return;

    let html = '';
    rates.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const prev = parseFloat(item.prev) || price;
        const diff = price - prev;
        const cls = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'neutral');
        const arrow = diff > 0 ? '▲' : (diff < 0 ? '▼' : '—');
        const diffStr = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff.toFixed(0)})` : '';

        html += `<span class="ticker-item ${cls}">
            <span class="ticker-arrow">${arrow}</span>
            <strong>${item.crop}</strong>: ₹${price.toLocaleString('en-IN')}${diffStr}
        </span>`;
    });

    inner.innerHTML = html + html; // Double for seamless infinite scroll
    inner.style.animation = 'none';
    void inner.offsetWidth; // Reflow to restart animation
    inner.style.animation = '';
}

// --- MAIN API FETCH LOGIC ---
async function updateMandiTicker() {
    try {
        const response = await fetch('/api/market/rates/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let rates = [];
        // Smart Data Extraction (Works for all JSON structures)
        if (Array.isArray(data)) {
            rates = normalizeRates(data);
        } else if (data && data.data && Array.isArray(data.data)) {
            rates = normalizeRates(data.data);
        } else if (data && data.rates && Array.isArray(data.rates)) {
            rates = normalizeRates(data.rates);
        }

        if (rates.length === 0) throw new Error('API returned empty records');

        // Check for Price Hikes & Trigger Voice Alerts
        rates.forEach(item => {
            if (lastKnownPrices[item.crop] && item.price > lastKnownPrices[item.crop]) {
                triggerPriceAlert(item, lastKnownPrices[item.crop]);
            }
            lastKnownPrices[item.crop] = item.price;
        });

        renderMandiTable(rates);
        renderMandiTicker(rates);

    } catch (e) {
        console.error('Mandi API Error, using fallback data:', e.message);
        renderMandiTable(FALLBACK_RATES);
        renderMandiTicker(FALLBACK_RATES);
    }
}

// --- ALERTS & NOTIFICATIONS ---
function triggerPriceAlert(item, oldPrice) {
    if (!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(`${item.crop} ka bhav badh gaya hai. Naya bhav ${item.price} rupaye hai`);
    msg.lang = 'hi-IN'; msg.rate = 0.9;
    window.speechSynthesis.speak(msg);

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📈 Mandi Rate Alert', {
            body: `${item.crop}: ₹${oldPrice} → ₹${item.price} (+₹${item.price - oldPrice})`,
        });
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function refreshMandiRates() {
    updateMandiTicker();
    if (typeof showToast === 'function') showToast('Mandi rates refreshed', 'success');
}

// --- CSS INJECTION & INITIALIZATION ---
(function injectTickerStyles() {
    if (document.getElementById('mandi-ticker-styles')) return;
    const style = document.createElement('style');
    style.id = 'mandi-ticker-styles';
    style.textContent = `
        .market-ticker { position: fixed; bottom: 0; left: 0; right: 0; z-index: 900; background: var(--bg-card, #1e293b); border-top: 1px solid var(--border-color, #334155); display: flex; align-items: center; height: 38px; overflow: hidden; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); color: white; }
        .ticker-label { padding: 0 14px; font-size: 0.8rem; white-space: nowrap; border-right: 1px solid var(--border-color, #334155); height: 100%; display: flex; align-items: center; background: var(--bg-main, #0f172a); flex-shrink: 0; }
        .ticker-track { flex: 1; overflow: hidden; height: 100%; display: flex; align-items: center; }
        .ticker-inner { display: flex; align-items: center; gap: 0; white-space: nowrap; animation: tickerScroll 60s linear infinite; will-change: transform; }
        .ticker-inner:hover { animation-play-state: paused; }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-item { padding: 0 20px; font-size: 0.82rem; border-right: 1px solid var(--border-color, #334155); height: 38px; display: inline-flex; align-items: center; gap: 5px; }
        .ticker-item.up { color: #10b981; } .ticker-item.down { color: #ef4444; } .ticker-item.neutral { color: var(--text-secondary, #94a3b8); }
        .ticker-arrow { font-size: 0.7rem; }
        .main-content, main { padding-bottom: 44px !important; }
    `;
    document.head.appendChild(style);
})();

// Auto-refresh every 10 minutes
setInterval(updateMandiTicker, 600000); 

document.addEventListener('DOMContentLoaded', () => {
    updateMandiTicker();
    requestNotificationPermission();
});

// For external modules (if using bundlers)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateMandiTicker, refreshMandiRates, filterMandiTable, sortMandiTable };
}
// Add this to the bottom of your existing template
function fetchLocationAndRates() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(sendPositionToBackend);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
}

function sendPositionToBackend(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Send silently to your Django backend
    fetch(`/api/get-mandi-rates/?lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
        // Inject the data into your existing HTML elements using their IDs
        // e.g., document.getElementById('mandi-price-display').innerText = data.rates;
        console.log(data); 
    });
}

// Trigger it (e.g., window.onload or attached to an existing 'Scan' button)
fetchLocationAndRates();