<<<<<<< HEAD
// === MANDI TICKER v5.0 — WITH LOCATION CROPS + PINCODE SEARCH ===

let lastKnownPrices = {};
window._mandiAllRates = [];       // Global cache (full rates, current source)
window._mandiBaseRates = [];      // Base rates from GPS location (to restore after pincode clear)
window._mandiCurrentLocation = null; // { lat, lng, district, state, pincode }

// --- FALLBACK DATA ---
const FALLBACK_RATES = [
    { crop: 'Wheat',    price: 2250, prev: 2200, unit: 'qtl', market: 'Lucknow' },
    { crop: 'Rice',     price: 3200, prev: 3250, unit: 'qtl', market: 'Lucknow' },
    { crop: 'Tomato',   price: 1800, prev: 1500, unit: 'qtl', market: 'Kanpur'  },
    { crop: 'Potato',   price: 1200, prev: 1150, unit: 'qtl', market: 'Agra'    },
    { crop: 'Onion',    price:  900, prev:  950, unit: 'qtl', market: 'Nashik'  },
    { crop: 'Mustard',  price: 5400, prev: 5300, unit: 'qtl', market: 'Meerut'  },
    { crop: 'Bajra',    price: 2100, prev: 2050, unit: 'qtl', market: 'Agra'    },
    { crop: 'Maize',    price: 1950, prev: 1900, unit: 'qtl', market: 'Kanpur'  },
];

// --- NORMALIZE API DATA ---
function normalizeRates(apiData) {
    if (!apiData || !Array.isArray(apiData)) return [];
    return apiData.map(item => ({
        crop:   item.crop || item.commodity || 'Unknown',
        price:  parseFloat(item.modal_price  || item.price      || 0),
        prev:   parseFloat(item.min_price    || item.prev_price || item.price || 0),
        max:    parseFloat(item.max_price    || item.price      || 0),
        market: item.market   || item.district || 'Local',
        unit:   'qtl',
        date:   item['price date'] || item.price_date || item.date || '',
    })).filter(r => r.crop !== 'Unknown' && r.price > 0);
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 1 — LOCATION-BASED CROPS
//  Called from wheather.js after GPS resolves
// ═══════════════════════════════════════════════════════════════

/**
 * Entry point: call this from wheather.js / fasal_features.js
 * after you have the user's lat/lng.
 *
 * @param {number} lat
 * @param {number} lon
 */
async function loadMandiRatesByLocation(lat, lon) {
    try {
        // Step 1 — Reverse-geocode to get district/state/pincode
        //          Uses a free nominatim call (no key needed)
        const geoRes  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const geoData = await geoRes.json();

        const addr    = geoData.address || {};
        const district = addr.county || addr.state_district || addr.city || addr.town || addr.village || 'Unknown';
        const state    = addr.state  || 'Uttar Pradesh';
        const pincode  = addr.postcode || '';

        window._mandiCurrentLocation = { lat, lon, district, state, pincode };

        // Step 2 — Show location banner
        _showLocationBanner(district, state, pincode);

        // Step 3 — Fetch rates for this location
        const rates = await _fetchRatesForLocation(district, state, pincode);
        window._mandiBaseRates = rates;
        window._mandiAllRates  = rates;

        renderMandiTable(rates);
        renderMandiTicker(rates);

    } catch (e) {
        console.error('[MandiLocation] Failed:', e.message);
        // Fallback gracefully
        renderMandiTable(FALLBACK_RATES);
        renderMandiTicker(FALLBACK_RATES);
    }
}

/** Fetch rates from backend for given district/state/pincode */
async function _fetchRatesForLocation(district, state, pincode) {
    try {
        const params = new URLSearchParams();
        if (district) params.set('district', district);
        if (state)    params.set('state',    state);
        if (pincode)  params.set('pincode',  pincode);

        const res  = await fetch(`/api/market/rates/?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let raw = [];
        if (Array.isArray(data))                          raw = data;
        else if (data.data  && Array.isArray(data.data))  raw = data.data;
        else if (data.rates && Array.isArray(data.rates)) raw = data.rates;

        const rates = normalizeRates(raw);
        if (!rates.length) throw new Error('empty');
        return rates;

    } catch (e) {
        console.warn('[MandiLocation] API failed, using fallback:', e.message);
        return FALLBACK_RATES;
    }
}

function _showLocationBanner(district, state, pincode) {
    const banner   = document.getElementById('mandi-location-banner');
    const nameEl   = document.getElementById('mandi-location-name');
    const subEl    = document.getElementById('mandi-location-sub');
    const seasonEl = document.getElementById('mandi-location-season');
    const countEl  = document.getElementById('mandi-location-crops-count');
    if (!banner) return;

    if (nameEl)   nameEl.textContent   = `${district}, ${state}`;
    if (subEl)    subEl.textContent    = pincode ? `PIN: ${pincode} · Nearest mandi rates` : 'Nearest mandi rates';
    if (seasonEl) seasonEl.textContent = _getCurrentSeason();
    if (countEl)  countEl.textContent  = '';   // Updated after rates load

    banner.style.display = 'block';
}

function _getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    if (month >= 3 && month <= 6)  return '🌞 Zaid Season';
    if (month >= 7 && month <= 10) return '🌧 Kharif Season';
    return '❄️ Rabi Season';
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 2 — PINCODE-BASED SEARCH
// ═══════════════════════════════════════════════════════════════

async function fetchRatesByPincode() {
    const input   = document.getElementById('mandi-pincode-input');
    const pincode = input ? input.value.trim() : '';

    if (!pincode || pincode.length < 5) {
        _flashInput(input, '#ef4444');
        return;
    }

    // Loading state
    _setTableLoading('Fetching rates for PIN ' + pincode + '...');

    try {
        // Step 1 — Resolve pincode → location name via Nominatim
        const geoRes  = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const geoData = await geoRes.json();

        let locationLabel = `PIN: ${pincode}`;
        let district = '';
        let state    = 'Uttar Pradesh';

        if (geoData && geoData.length > 0) {
            const displayName = geoData[0].display_name || '';
            // Extract district & state from display_name string
            const parts = displayName.split(',').map(s => s.trim());
            district = parts[1] || parts[0] || '';
            state    = parts[parts.length - 2] || state;
            locationLabel = parts.slice(0, 3).join(', ');
        }

        // Step 2 — Fetch mandi rates for that pincode/district
        const rates = await _fetchRatesForLocation(district, state, pincode);

        // Step 3 — Show pincode banner
        _showPincodeBanner(pincode, locationLabel, rates.length);

        // Step 4 — Update table
        window._mandiAllRates = rates;
        renderMandiTable(rates);
        renderMandiTicker(rates);

    } catch (e) {
        console.error('[MandiPincode] Error:', e.message);
        _setTableLoading('Could not fetch data for this PIN. Try again.', true);
    }
}

function _showPincodeBanner(pincode, areaLabel, count) {
    const banner  = document.getElementById('mandi-pincode-banner');
    const labelEl = document.getElementById('mandi-pincode-label');
    const areaEl  = document.getElementById('mandi-pincode-area');
    if (!banner) return;

    if (labelEl) labelEl.textContent = `Showing rates for PIN ${pincode}`;
    if (areaEl)  areaEl.textContent  = `— ${areaLabel} · ${count} crops`;
    banner.style.display = 'flex';
}

function clearPincodeFilter() {
    const banner = document.getElementById('mandi-pincode-banner');
    const input  = document.getElementById('mandi-pincode-input');
    if (banner) banner.style.display = 'none';
    if (input)  input.value = '';

    // Restore GPS-based rates if available
    const rates = window._mandiBaseRates.length ? window._mandiBaseRates : FALLBACK_RATES;
    window._mandiAllRates = rates;
    renderMandiTable(rates);
    renderMandiTicker(rates);
}

// ═══════════════════════════════════════════════════════════════
//  TABLE RENDERING
// ═══════════════════════════════════════════════════════════════

function renderMandiTable(rates) {
    window._mandiAllRates = rates;
    _renderTable(rates);

    const label = document.getElementById('mandi-last-updated');
    if (label) {
        const now = new Date();
        label.textContent = `Updated: ${now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}`;
    }

    // Update crop count in location banner
    const countEl = document.getElementById('mandi-location-crops-count');
    if (countEl) countEl.textContent = `${rates.length} crops`;
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
        const minPrice = parseFloat(item.prev) || 0;
        const maxPrice = parseFloat(item.max) || parseFloat(item.price) || 0;
        const diff = maxPrice - minPrice;
        
        let arrowHtml = '<span style="color:#888;">—</span>';
        if (diff > 0) {
            arrowHtml = '<span style="color:#10b981; font-weight:bold;">↑</span>';
        } else if (diff < 0) {
            arrowHtml = '<span style="color:#ef4444; font-weight:bold;">↓</span>';
        }

        html += `<tr style="border-bottom:1px solid #eef6ee; transition:background 0.2s;"
                    onmouseover="this.style.background='#f9fdf9'"
                    onmouseout="this.style.background=''">
            <td style="padding:14px 20px;">
                <strong style="font-size:0.9rem; color:#444;">${item.crop}</strong>
            </td>
            <td style="padding:14px 20px; color:#666; font-size:0.85rem;">
                ${item.market}
            </td>
            <td style="padding:14px 20px; text-align:right; color:#555; font-size:0.9rem;">
                ₹${minPrice.toLocaleString('en-IN')}
            </td>
            <td style="padding:14px 20px; text-align:right; color:#555; font-size:0.9rem;">
                ₹${maxPrice.toLocaleString('en-IN')}
            </td>
            <td style="padding:14px 20px; text-align:right; font-size:1.1rem;">
                ${arrowHtml}
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function _setTableLoading(message, isError = false) {
    const tbody = document.getElementById('mandi-tbody');
    if (!tbody) return;
    const icon  = isError ? 'fa-exclamation-circle' : 'fa-spinner fa-spin';
    const color = isError ? '#ef4444' : 'var(--text-light)';
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:${color};">
        <i class="fas ${icon}"></i> ${message}
    </td></tr>`;
}

// ═══════════════════════════════════════════════════════════════
//  SORTING & FILTERING
// ═══════════════════════════════════════════════════════════════

function filterMandiTable(query) {
    const q = query.toLowerCase().trim();
    if (!q) { _renderTable(window._mandiAllRates); return; }
    const filtered = window._mandiAllRates.filter(r =>
        r.crop.toLowerCase().includes(q) || (r.market && r.market.toLowerCase().includes(q))
    );
    _renderTable(filtered);
}

function sortMandiTable(by) {
    if (!window._mandiAllRates.length) return;
    let sorted = [...window._mandiAllRates];
    if      (by === 'name')       sorted.sort((a, b) => a.crop.localeCompare(b.crop));
    else if (by === 'price-high') sorted.sort((a, b) => (parseFloat(b.price)||0) - (parseFloat(a.price)||0));
    else if (by === 'price-low')  sorted.sort((a, b) => (parseFloat(a.price)||0) - (parseFloat(b.price)||0));
    else if (by === 'change')     sorted.sort((a, b) => {
        const da = Math.abs((parseFloat(a.price)||0) - (parseFloat(a.prev)||parseFloat(a.price)||0));
        const db = Math.abs((parseFloat(b.price)||0) - (parseFloat(b.prev)||parseFloat(b.price)||0));
        return db - da;
    });
    _renderTable(sorted);
}

// ═══════════════════════════════════════════════════════════════
//  TICKER RENDERING
// ═══════════════════════════════════════════════════════════════

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
        const price   = parseFloat(item.price) || 0;
        const prev    = parseFloat(item.prev)  || price;
        const diff    = price - prev;
        const cls     = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'neutral');
        const arrow   = diff > 0 ? '▲' : (diff < 0 ? '▼' : '—');
        const diffStr = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff.toFixed(0)})` : '';
        html += `<span class="ticker-item ${cls}">
            <span class="ticker-arrow">${arrow}</span>
            <strong>${item.crop}</strong>: ₹${price.toLocaleString('en-IN')}${diffStr}
        </span>`;
    });

    inner.innerHTML = html + html;
    inner.style.animation = 'none';
    void inner.offsetWidth;
    inner.style.animation = '';
}

// ═══════════════════════════════════════════════════════════════
//  MAIN API FETCH (Default — no GPS)
// ═══════════════════════════════════════════════════════════════

async function updateMandiTicker() {
    // If we already have GPS-based rates loaded, skip default fetch
    if (window._mandiBaseRates && window._mandiBaseRates.length > 0) return;

    try {
        const response = await fetch('/api/market/rates/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        let raw = [];
        if (Array.isArray(data))                           raw = data;
        else if (data.data  && Array.isArray(data.data))   raw = data.data;
        else if (data.rates && Array.isArray(data.rates))  raw = data.rates;

        const rates = normalizeRates(raw);
        if (!rates.length) throw new Error('empty');

        rates.forEach(item => {
            if (lastKnownPrices[item.crop] && item.price > lastKnownPrices[item.crop]) {
                triggerPriceAlert(item, lastKnownPrices[item.crop]);
            }
            lastKnownPrices[item.crop] = item.price;
        });

        renderMandiTable(rates);
        renderMandiTicker(rates);

    } catch (e) {
        console.error('Mandi API Error, using fallback:', e.message);
        renderMandiTable(FALLBACK_RATES);
        renderMandiTicker(FALLBACK_RATES);
    }
}

// ═══════════════════════════════════════════════════════════════
//  ALERTS
// ═══════════════════════════════════════════════════════════════

function triggerPriceAlert(item, oldPrice) {
    if (!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(
        `${item.crop} ka bhav badh gaya hai. Naya bhav ${item.price} rupaye hai`
    );
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
    // If pincode is active, re-fetch pincode data; else re-fetch location data
    const pincodeInput = document.getElementById('mandi-pincode-input');
    if (pincodeInput && pincodeInput.value.trim().length >= 5) {
        fetchRatesByPincode();
    } else if (window._mandiCurrentLocation) {
        const { lat, lon } = window._mandiCurrentLocation;
        loadMandiRatesByLocation(lat, lon);
    } else {
        window._mandiBaseRates = []; // Force refresh
        updateMandiTicker();
    }
    if (typeof showToast === 'function') showToast('Mandi rates refreshed', 'success');
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function _flashInput(el, color) {
    if (!el) return;
    el.style.borderColor = color;
    el.style.boxShadow   = `0 0 0 2px ${color}33`;
    setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1200);
}

// ═══════════════════════════════════════════════════════════════
//  CSS INJECTION
// ═══════════════════════════════════════════════════════════════

(function injectTickerStyles() {
    if (document.getElementById('mandi-ticker-styles')) return;
    const style = document.createElement('style');
    style.id    = 'mandi-ticker-styles';
    style.textContent = `
        .market-ticker { position:fixed; bottom:0; left:0; right:0; z-index:900; background:var(--bg-card,#1e293b); border-top:1px solid var(--border-color,#334155); display:flex; align-items:center; height:38px; overflow:hidden; box-shadow:0 -2px 8px rgba(0,0,0,0.06); color:white; }
        .ticker-label  { padding:0 14px; font-size:0.8rem; white-space:nowrap; border-right:1px solid var(--border-color,#334155); height:100%; display:flex; align-items:center; background:var(--bg-main,#0f172a); flex-shrink:0; }
        .ticker-track  { flex:1; overflow:hidden; height:100%; display:flex; align-items:center; }
        .ticker-inner  { display:flex; align-items:center; gap:0; white-space:nowrap; animation:tickerScroll 60s linear infinite; will-change:transform; }
        .ticker-inner:hover { animation-play-state:paused; }
        @keyframes tickerScroll { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        .ticker-item   { padding:0 20px; font-size:0.82rem; border-right:1px solid var(--border-color,#334155); height:38px; display:inline-flex; align-items:center; gap:5px; }
        .ticker-item.up      { color:#10b981; }
        .ticker-item.down    { color:#ef4444; }
        .ticker-item.neutral { color:var(--text-secondary,#94a3b8); }
        .ticker-arrow  { font-size:0.7rem; }
        .main-content, main { padding-bottom:44px !important; }

        /* Pincode input flash animation */
        @keyframes pincodeShake {
            0%,100% { transform:translateX(0); }
            20%,60% { transform:translateX(-4px); }
            40%,80% { transform:translateX(4px); }
        }
    `;
    document.head.appendChild(style);
})();

// ═══════════════════════════════════════════════════════════════
//  INTEGRATION HOOK FOR wheather.js / fasal_features.js
//
//  In wheather.js → sendToDjango(), add after populating weather card:
//
//      if (typeof loadMandiRatesByLocation === 'function') {
//          loadMandiRatesByLocation(lat, lon);
//      }
//
// ═══════════════════════════════════════════════════════════════

// Auto-refresh every 10 minutes
setInterval(() => {
    if (!window._mandiCurrentLocation) updateMandiTicker();
}, 600000);

document.addEventListener('DOMContentLoaded', () => {
    updateMandiTicker();
    requestNotificationPermission();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateMandiTicker, refreshMandiRates,
        filterMandiTable,  sortMandiTable,
        loadMandiRatesByLocation, fetchRatesByPincode, clearPincodeFilter
    };
}

if (window.FasalLocation) {
    window.FasalLocation.setFromCoords(lat, lng);
}
=======
/**
 * fasal_features.js — Fasal AI Protector (U.P. Release)
 *
 * Features:
 *  1. GPS detection → inject lat/lng into scan form, call /api/scanner/location-info/
 *  2. Location badge + info box rendering (fertilizer tips, common diseases, season)
 *  3. Mandi enhanced search UI (keyboard search over /api/scanner/mandi/search/)
 *  4. FasalScan.renderAdvice(data) — renders LLM advice card after scan
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     1. GPS DETECTION
     ══════════════════════════════════════════════════════ */

  let _gpsCoords = null; // { lat, lng } once resolved

  function initGPS() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        _gpsCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        _injectCoordsIntoForms(_gpsCoords);
        _fetchLocationInfo(_gpsCoords);
      },
      function (err) {
        console.log('[FasalGPS] Permission denied or unavailable:', err.message);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }

  /** Inject lat/lng as hidden inputs into any form containing #file-input or #predict-btn */
  function _injectCoordsIntoForms(coords) {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      _setOrCreate(form, 'fasal-lat', coords.lat);
      _setOrCreate(form, 'fasal-lng', coords.lng);
    });

    // Also set on the scanner section itself (JS FormData population)
    window._fasalLat = coords.lat;
    window._fasalLng = coords.lng;
  }

  function _setOrCreate(parent, name, value) {
    var existing = parent.querySelector('input[name="' + name + '"]');
    if (existing) {
      existing.value = value;
    } else {
      var inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = name;
      inp.value = value;
      parent.appendChild(inp);
    }
  }

  /* ══════════════════════════════════════════════════════
     2. LOCATION INFO — /api/scanner/location-info/
     ══════════════════════════════════════════════════════ */

  function _fetchLocationInfo(coords) {
    var url = '/api/scanner/location-info/?lat=' + coords.lat + '&lng=' + coords.lng;

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success) return;
        _renderLocationBadge(data);
        _renderLocationInfoBox(data);
      })
      .catch(function (e) {
        console.log('[FasalGPS] location-info fetch failed:', e.message);
      });
  }

  function _renderLocationBadge(data) {
    var badge = document.getElementById('location-badge');
    if (!badge) return;
    badge.style.display = 'inline-flex';
    badge.style.cssText = [
      'display:inline-flex', 'align-items:center', 'gap:6px',
      'background:rgba(0,176,155,0.12)', 'color:var(--primary,#00b09b)',
      'border:1px solid rgba(0,176,155,0.3)', 'border-radius:999px',
      'padding:4px 12px', 'font-size:0.8rem', 'font-weight:600',
      'margin-bottom:8px'
    ].join(';');
    badge.innerHTML =
      '<i class="fas fa-map-marker-alt"></i> ' +
      data.district + ', ' + data.state +
      ' &nbsp;|&nbsp; <i class="fas fa-leaf"></i> ' + data.season;
  }

  function _renderLocationInfoBox(data) {
    var box = document.getElementById('location-info-box');
    if (!box) return;

    var fertHtml = '';
    if (data.fertilizer_tips && data.fertilizer_tips.length) {
      fertHtml = '<div style="margin-bottom:10px;">' +
        '<strong style="color:var(--primary,#00b09b)"><i class="fas fa-tint"></i> Fertilizer Tips for ' + data.district + ':</strong>' +
        '<ul style="margin:6px 0 0 16px;padding:0;font-size:0.83rem;color:var(--text-main);">' +
        data.fertilizer_tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') +
        '</ul></div>';
    }

    var diseaseHtml = '';
    if (data.common_diseases && data.common_diseases.length) {
      diseaseHtml = '<div>' +
        '<strong style="color:var(--danger,#ef4444)"><i class="fas fa-bug"></i> Common Diseases in this District:</strong>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">' +
        data.common_diseases.map(function (d) {
          return '<span style="background:rgba(239,68,68,0.1);color:var(--danger,#ef4444);' +
            'border:1px solid rgba(239,68,68,0.2);border-radius:999px;' +
            'padding:2px 10px;font-size:0.78rem;">' + d + '</span>';
        }).join('') +
        '</div></div>';
    }

    if (!fertHtml && !diseaseHtml) return;

    box.style.display = 'block';
    box.style.cssText = [
      'display:block', 'background:var(--bg-card)', 'border:1px solid var(--border-color)',
      'border-radius:var(--radius-lg)', 'padding:14px 16px', 'margin-top:12px',
      'font-family:inherit'
    ].join(';');
    box.innerHTML = fertHtml + diseaseHtml;
  }

  /* ══════════════════════════════════════════════════════
     3. MANDI ENHANCED SEARCH
     ══════════════════════════════════════════════════════ */

  var _mandiSearchTimeout = null;
  var _allMandiRates = [];

  function _initMandiSearch() {
    var section = document.getElementById('mandi-section');
    if (!section) return;

    // Find the existing search input (already in mandi.html)
    var searchInput = document.getElementById('mandi-search');
    if (!searchInput) return;

    // Override the existing oninput to use our API search
    searchInput.removeAttribute('oninput');
    searchInput.addEventListener('input', function () {
      var q = this.value.trim();
      clearTimeout(_mandiSearchTimeout);
      if (q.length < 2) {
        // If cleared, restore all rates from cached data
        if (_allMandiRates.length) _populateMandiTable(_allMandiRates);
        return;
      }
      _mandiSearchTimeout = setTimeout(function () {
        _doMandiSearch(q);
      }, 350);
    });
  }

  function _doMandiSearch(q) {
    fetch('/api/scanner/mandi/search/?q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          _populateMandiTable(data.rates || []);
        }
      })
      .catch(function (e) {
        console.log('[FasalMandi] Search error:', e.message);
      });
  }

  function _populateMandiTable(rates) {
    var tbody = document.getElementById('mandi-tbody');
    if (!tbody) return;

    if (!rates.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-light);">No results found</td></tr>';
      return;
    }

    tbody.innerHTML = rates.map(function (r) {
      var crop = r.crop || r.commodity || r.name || 'Unknown';
      var prev = r.prev_price || r.previous || r.min_price || '—';
      var today = r.price || r.today_price || r.modal_price || '—';
      var change = r.change || r.change_pct || '';
      var trend = r.trend || '';

      var changeHtml = '';
      if (change) {
        var isPos = String(change).indexOf('+') !== -1 || parseFloat(change) > 0;
        var col = isPos ? '#10b981' : '#ef4444';
        var icon = isPos ? '▲' : '▼';
        changeHtml = '<span style="color:' + col + ';font-weight:600">' + icon + ' ' + change + '</span>';
      }

      return '<tr style="border-bottom:1px solid var(--border-color)">' +
        '<td style="padding:12px 16px;font-weight:500">' + crop + '</td>' +
        '<td style="padding:12px 16px;text-align:right">₹' + prev + '</td>' +
        '<td style="padding:12px 16px;text-align:right;font-weight:700">₹' + today + '</td>' +
        '<td style="padding:12px 16px;text-align:center">' + (changeHtml || '—') + '</td>' +
        '<td style="padding:12px 16px;text-align:center">' + (trend || '—') + '</td>' +
        '</tr>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     4. LLM ADVICE RENDERER
     ══════════════════════════════════════════════════════ */

  var FasalScan = {
    /**
     * Call after a successful scan API response.
     * Expects data.llm_advice (string) to be present.
     *
     * @param {Object} data  — full JSON response from /api/scanner/scan/ or similar
     */
    renderAdvice: function (data) {
      var box = document.getElementById('llm-advice-box');
      if (!box) return;

      var adviceText = data.llm_advice || data.llm_expert_advice || '';
      if (!adviceText) {
        box.style.display = 'none';
        return;
      }

      var location = data.llm_location || data.location || 'Uttar Pradesh';
      var crop = data.top_crop || '';
      var disease = data.top_disease || '';
      var isHealthy = data.is_healthy || false;

      var accentColor = isHealthy ? 'var(--success,#10b981)' : 'var(--primary,#00b09b)';
      var icon = isHealthy ? 'fa-check-circle' : 'fa-robot';
      var header = isHealthy
        ? '✅ Fasal AI — Healthy Crop Advice'
        : '🤖 Fasal AI — Expert Advice (' + (crop || 'Your Crop') + ')';

      // Convert newlines to <br> and bold **text**:
      var formattedText = adviceText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

      box.style.display = 'block';
      box.innerHTML =
        '<div id="llm-advice-card" style="' + [
          'background:linear-gradient(135deg,rgba(0,176,155,0.07),rgba(150,201,61,0.07))',
          'border:1px solid rgba(0,176,155,0.25)',
          'border-radius:var(--radius-lg,12px)',
          'padding:18px 20px',
          'margin-top:16px',
          'font-family:inherit',
          'animation:fadeInUp 0.4s ease'
        ].join(';') + '">' +

        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<div style="background:rgba(0,176,155,0.15);color:' + accentColor + ';' +
        'width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;">' +
        '<i class="fas ' + icon + '"></i></div>' +
        '<div>' +
        '<div style="font-weight:700;font-size:0.95rem;color:var(--text-main)">' + header + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-light)"><i class="fas fa-map-marker-alt"></i> ' + location + '</div>' +
        '</div></div>' +

        '<div style="font-size:0.88rem;line-height:1.7;color:var(--text-main);' +
        'border-top:1px solid var(--border-color);padding-top:12px;">' +
        formattedText +
        '</div>' +

        '<div style="margin-top:12px;font-size:0.75rem;color:var(--text-light);' +
        'display:flex;align-items:center;gap:6px;">' +
        '<i class="fas fa-brain"></i> Powered by Gemma-2 · Verified UP Dataset' +
        '</div></div>';

      // Smooth scroll to advice card
      setTimeout(function () {
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 200);
    },

    clearAdvice: function () {
      var box = document.getElementById('llm-advice-box');
      if (box) { box.style.display = 'none'; box.innerHTML = ''; }
    }
  };

  // Expose globally
  window.FasalScan = FasalScan;

  /* ══════════════════════════════════════════════════════
     INIT on DOM ready
     ══════════════════════════════════════════════════════ */

  function init() {
    initGPS();
    _initMandiSearch();

    // Clear advice when scan is cleared
    var clearBtn = document.querySelector('[onclick="clearScanPreview()"]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        FasalScan.clearAdvice();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
