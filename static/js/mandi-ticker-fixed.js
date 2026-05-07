<<<<<<< HEAD
// ═══════════════════════════════════════════════════════
//  MANDI RATES — v6.0
//  - Mock data bilkul nahi — sirf real Agmarknet data
//  - Fallback: requested district nahi mila → nearest UP mandi
//  - No data: clean message, N/A rows (no fake numbers)
//  - Refresh pe properly same district reload hota hai
// ═══════════════════════════════════════════════════════

const TARGET_CROPS = [
    "Wheat", "Paddy", "Tomato", "Potato", "Onion", "Mustard", "Garlic",
    "Pea", "Gram", "Lentil", "Sugarcane", "Maize", "Bajra", "Jowar", "Barley",
    "Cauliflower", "Cabbage", "Radish", "Carrot", "Brinjal", "Chilli", "Okra",
    "Bottle Gourd", "Pumpkin", "Spinach", "Fenugreek", "Coriander", "Moong",
    "Urad", "Arhar", "Soyabean", "Cotton"
];

// Resolved district store — refresh pe same district use hota hai
let _resolvedDistrict  = null;
let _requestedDistrict = null;

// ── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('mandi-location-banner').style.display = 'block';
    setLoadingState("Live location detect ho rahi hai...");
    // FasalLocation (script.js) setDistrictAndFetch() call karega
    // Agar already resolved ho:
    if (window.FasalLocation && window.FasalLocation.district) {
        const src = { gps: 'GPS', profile: 'Profile', pincode: 'Pincode' }[window.FasalLocation.source] || 'Default';
        setDistrictAndFetch(window.FasalLocation.district, src);
    }
});

// ── Refresh button — same district reload ───────────────
function refreshMandiRates() {
    const d = _requestedDistrict || (window.FasalLocation && window.FasalLocation.district) || "Lucknow";
    setLoadingState("Rates refresh ho rahi hain...");
    fetchMandiFromBackend(d);
}

// ── Pincode search ───────────────────────────────────────
function fetchRatesByPincode() {
    const pin = document.getElementById('mandi-pincode-input').value.trim();
    if (pin.length !== 6 || isNaN(pin)) { alert("Valid 6-digit Pincode daalen."); return; }
    setLoadingState(`Pincode ${pin} se district dhundh raha hai...`);

    if (window.FasalLocation) {
        window.FasalLocation.setFromPincode(pin).then(d => {
            if (!d) { alert("Invalid Pincode!"); setDistrictAndFetch("Lucknow", "Default"); }
        });
    } else {
        fetch(`https://api.postalpincode.in/pincode/${pin}`)
            .then(r => r.json())
            .then(data => {
                if (data[0].Status === "Success") setDistrictAndFetch(data[0].PostOffice[0].District.trim(), `PIN: ${pin}`);
                else { alert("Invalid Pincode!"); setDistrictAndFetch("Lucknow", "Default"); }
            })
            .catch(() => setDistrictAndFetch("Lucknow", "Default"));
    }
}

// ── Called by FasalLocation._apply() + pincode + refresh ─
function setDistrictAndFetch(district, source) {
    _requestedDistrict = district;
    document.getElementById('mandi-location-name').innerText = district;
    const subEl = document.getElementById('mandi-location-sub');
    if (subEl) subEl.innerText = `${source} — Nearest mandi data load ho raha hai...`;
    fetchMandiFromBackend(district);
}

function setLoadingState(msg) {
    document.getElementById('mandi-tbody').innerHTML = `
        <tr><td colspan="5" style="text-align:center; padding:50px; color:var(--text-light);">
            <i class="fas fa-spinner fa-spin" style="font-size:1.6rem; margin-bottom:12px; display:block; color:var(--primary);"></i>
            <span style="font-size:0.9rem;">${msg}</span>
        </td></tr>`;
}

// ── Core fetch with error handling ───────────────
let _fetchAttempts = 0;
const MAX_ATTEMPTS = 2;

async function fetchMandiFromBackend(requestedDistrict, isYesterday = false) {
    setLoadingState(`<b>${requestedDistrict}</b> ke liye mandi data fetch ho raha hai...`);
    _fetchAttempts = 0;

    try {
        await fetchMandiAttempt(requestedDistrict, isYesterday, 0);
    } catch (err) {
        console.error("Mandi fetch error:", err);
        showErrorPopup(requestedDistrict);
    }
}

async function fetchMandiAttempt(requestedDistrict, isYesterday, attempt) {
    try {
        const url = isYesterday
            ? `/api/mandi-rates/?district=${encodeURIComponent(requestedDistrict)}&yesterday=true`
            : `/api/mandi-rates/?district=${encodeURIComponent(requestedDistrict)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        // Check for notice (data not available)
        if (!json.success && json.notice) {
            showErrorPopup(requestedDistrict, json.notice);
            return;
        }

        const records = json.rates || [];
        if (records.length === 0 && attempt < MAX_ATTEMPTS - 1) {
            // Try again
            attempt++;
            console.log(`Retry attempt ${attempt + 1} for ${requestedDistrict}`);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
            await fetchMandiAttempt(requestedDistrict, isYesterday, attempt);
            return;
        }

        if (records.length === 0) {
            showErrorPopup(requestedDistrict);
            return;
        }

        const source = json.source || '';
        const isYesterdayData = source.includes("Yesterday");

        _resolvedDistrict = requestedDistrict;
        renderTable(records, requestedDistrict, requestedDistrict, isYesterdayData);

    } catch (err) {
        if (attempt < MAX_ATTEMPTS - 1) {
            attempt++;
            console.log(`Retry attempt ${attempt + 1} for ${requestedDistrict}`);
            await new Promise(r => setTimeout(r, 1000));
            await fetchMandiAttempt(requestedDistrict, isYesterday, attempt);
        } else {
            throw err;
        }
    }
}

function showErrorPopup(district, notice = null) {
    const tbody = document.getElementById('mandi-tbody');
    if (!tbody) return;

    const noticeData = notice || {
        title: '⚠️ Data Not Available',
        message: 'Government portal is not responding. Please try yesterday\'s data.',
        show_yesterday: true
    };

    const yesterdayBtn = noticeData.show_yesterday
        ? `<button onclick="loadYesterdayMandi()" style="background:linear-gradient(135deg,#00b09b,#96c93d);color:white;border:none;padding:12px 24px;border-radius:25px;cursor:pointer;font-weight:600;margin-top:15px;display:inline-flex;align-items:center;gap:8px;font-size:1rem;">
             <i class="fas fa-clock"></i> Show Yesterday's Data
           </button>`
        : '';

    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="padding:50px 20px;text-align:center;background:linear-gradient(135deg,#fef3c7,#fef9c3);">
                <div style="font-size:3.5rem;margin-bottom:15px;">📡</div>
                <div style="font-size:1.2rem;font-weight:700;color:#b45309;margin-bottom:10px;">
                    ${noticeData.title}
                </div>
                <div style="color:#92400e;margin-bottom:20px;font-size:0.95rem;max-width:400px;margin-left:auto;margin-right:auto;">
                    ${noticeData.message}
                </div>
                <div style="text-align:center;">
                    ${yesterdayBtn}
                </div>
            </td>
        </tr>
    `;

    setLoadingState('');
}

// ── Load Yesterday's Data ─────────────────────────────────
function loadYesterdayMandi() {
    const pincodeInput = document.getElementById('mandi-pincode-input');
    let district = _resolvedDistrict || 'Lucknow';

    if (pincodeInput && pincodeInput.value) {
        district = pincodeInput.value;
    }

    fetchMandiFromBackend(district, true);
}

// ── Full table render ────────────────────────────────────
function renderTable(apiRecords, actualDistrict, requestedDistrict, isYesterday = false) {
    const tbody = document.getElementById('mandi-tbody');

    if (!apiRecords || apiRecords.length === 0) {
        renderNoDataState(requestedDistrict, "No data available");
=======
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
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
        return;
    }

    let html = '';
<<<<<<< HEAD
    let liveCount = 0;

    // Show yesterday badge if data is from yesterday
    if (isYesterday) {
        const banner = document.getElementById('mandi-location-banner');
        if (banner) {
            banner.style.display = 'flex';
            banner.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;width:100%;">
                    <div style="background:rgba(245,158,11,0.2);padding:6px 12px;border-radius:20px;color:#d97706;font-size:0.8rem;display:flex;align-items:center;gap:6px;">
                        <i class="fas fa-clock"></i> Yesterday's Data
                    </div>
                    <div style="flex:1;"></div>
                    <button onclick="fetchMandiFromBackend('${requestedDistrict}', false)" style="background:transparent;border:1px solid #d97706;color:#d97706;padding:4px 12px;border-radius:15px;font-size:0.75rem;cursor:pointer;">
                        Refresh Today
                    </button>
                </div>
            `;
        }
    }

    const cropPrices = {};
    apiRecords.forEach(r => {
        const key = r.crop_en || r.crop;
        cropPrices[key] = r;
    });

    TARGET_CROPS.forEach(crop => {
        const record = cropPrices[crop] || cropPrices[crop.toLowerCase()];

        if (record) {
            liveCount++;
            const modal  = parseInt(record.modal_price) || parseInt(record.price) || 0;
            const min    = parseInt(record.min_price)   || modal;
            const max    = parseInt(record.max_price)  || modal;
            const change = modal - min;
            const pct    = min > 0 ? ((change / min) * 100).toFixed(1) : 0;
            const color  = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#a1a1aa';
            const arrow  = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            const icon   = change > 0 ? 'fa-arrow-trend-up' : change < 0 ? 'fa-arrow-trend-down' : 'fa-minus';
            const sign   = change > 0 ? '+' : '';
            const bar    = Math.min(Math.abs(pct) * 4, 100);
            const market = record.market || 'Local Mandi';

            html += `
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:10px 14px;">
                        <div style="font-weight:600; color:var(--text-main); font-size:0.9rem;">${crop}</div>
                    </td>
                    <td style="padding:10px 14px;">
                        <div style="font-size:0.75rem; color:#666;">${market}</div>
                    </td>
                    <td style="padding:10px 14px; text-align:right; font-size:0.85rem; color:#666;">₹${min.toLocaleString('en-IN')}</td>
                    <td style="padding:10px 14px; text-align:right; font-weight:700; color:var(--primary); font-size:0.95rem;">₹${max.toLocaleString('en-IN')}</td>
                    <td style="padding:10px 14px; text-align:center;">
                        <div style="display:inline-flex; align-items:center; gap:4px; padding:4px 8px; background:${color}15; border-radius:12px;">
                            <i class="fas ${icon}" style="color:${color}; font-size:0.7rem;"></i>
                            <span style="color:${color}; font-weight:600; font-size:0.75rem;">${sign}${pct}%</span>
                        </div>
                    </td>
                </tr>`;
        } else {
            html += `
                <tr style="border-bottom:1px solid #f0f0f0; background:#fafafa;">
                    <td style="padding:10px 14px;">
                        <div style="font-weight:600; color:var(--text-main); font-size:0.9rem;">${crop}</div>
                    </td>
                    <td style="padding:10px 14px;">
                        <div style="font-size:0.75rem; color:#999;">—</div>
                    </td>
                    <td style="padding:10px 14px; text-align:right; color:#999; font-size:0.85rem;">—</td>
                    <td style="padding:10px 14px; text-align:right; color:#999; font-size:0.85rem;">—</td>
                    <td style="padding:10px 14px; text-align:center; color:#999;">—</td>
                </tr>`;
        }
    });

    tbody.innerHTML = html;
    updateBanner(actualDistrict, requestedDistrict, false, liveCount);
}

// ── No data state ────────────────────────────────────────
function renderNoDataState(district, reason) {
    document.getElementById('mandi-tbody').innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; padding:60px 20px;">
                <div style="font-size:2.5rem; margin-bottom:12px;">📭</div>
                <div style="font-weight:700; font-size:1rem; color:var(--text-main); margin-bottom:6px;">
                    ${district} ka data aaj available nahi hai
                </div>
                <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:16px;">${reason}</div>
                <button onclick="refreshMandiRates()" style="background:var(--primary); color:#fff; border:none; padding:8px 20px; border-radius:20px; cursor:pointer; font-size:0.85rem;">
                    <i class="fas fa-sync-alt"></i> Dobara Try Karein
                </button>
            </td>
        </tr>`;

    // Banner — no data state
    document.getElementById('mandi-location-name').innerText = district;
    const subEl = document.getElementById('mandi-location-sub');
    if (subEl) subEl.innerHTML = `<i class="fas fa-circle" style="color:#ef4444; font-size:0.5rem; vertical-align:middle;"></i> Agmarknet par aaj data upload nahi hua`;
    const seasonEl = document.getElementById('mandi-location-season');
    if (seasonEl) { seasonEl.innerText = 'No Data'; seasonEl.style.background = 'rgba(239,68,68,0.1)'; seasonEl.style.color = '#b91c1c'; }
    const cropsEl = document.getElementById('mandi-location-crops-count');
    if (cropsEl) cropsEl.innerText = '0/32 Crops Live';
}

// ── Banner update ────────────────────────────────────────
function updateBanner(actualDistrict, requestedDistrict, isFallback, liveCount) {
    document.getElementById('mandi-location-name').innerText = actualDistrict;

    const subEl = document.getElementById('mandi-location-sub');
    if (subEl) {
        if (isFallback) {
            subEl.innerHTML = `<i class="fas fa-circle" style="color:#f59e0b; font-size:0.5rem; vertical-align:middle;"></i> `
                + `<b>${requestedDistrict}</b> ka data nahi mila — Nearest available: <b>${actualDistrict}</b>`;
        } else {
            subEl.innerHTML = `<i class="fas fa-circle" style="color:#10b981; font-size:0.5rem; vertical-align:middle;"></i> `
                + `${liveCount}/32 crops ka live data — ${actualDistrict} Mandi`;
        }
    }

    const seasonEl = document.getElementById('mandi-location-season');
    if (seasonEl) {
        seasonEl.innerText = isFallback ? 'Nearest' : 'Live';
        seasonEl.style.background = isFallback ? 'rgba(245,158,11,0.15)' : 'rgba(150,201,61,0.15)';
        seasonEl.style.color      = isFallback ? '#b45309' : '#5a8a00';
    }
    const cropsEl = document.getElementById('mandi-location-crops-count');
    if (cropsEl) cropsEl.innerText = `${liveCount}/32 Crops Live`;
    const updEl = document.getElementById('mandi-last-updated');
    if (updEl) updEl.innerText = `Updated: ${new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

// ── Search filter ────────────────────────────────────────
function filterMandiTable(query) {
    document.querySelectorAll('#mandi-tbody tr').forEach(row => {
        const name = row.cells[0]?.innerText?.toLowerCase() || '';
        row.style.display = name.includes(query.toLowerCase()) ? '' : 'none';
    });
}
=======
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
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
