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
