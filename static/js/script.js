/* ═══════════════════════════════════════════════════
   FASAL AI PROTECTOR — Main Application Script v7.0
   Real auth, CSRF, fixed bugs, modern UX
   ═══════════════════════════════════════════════════ */

// ─── CSRF Token Helper ───
function getCookie(name) {
    let value = null;
    if (document.cookie) {
        const parts = document.cookie.split(';');
        for (let i = 0; i < parts.length; i++) {
            const c = parts[i].trim();
            if (c.startsWith(name + '=')) {
                value = decodeURIComponent(c.substring(name.length + 1));
                break;
            }
        }
    }
    return value;
}

function getCSRFToken() {
    return getCookie('csrftoken') || '';
}

// ─── Toast Notifications ───
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ═══════════════════════════════════════════
// AUTHENTICATION — Real Django Backend
// ═══════════════════════════════════════════

function switchAuthTab(tab, btn) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('login-section').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signup-section').style.display = tab === 'signup' ? 'block' : 'none';
}

async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        showToast('Please enter username and password', 'warning');
        return;
    }

    const btn = document.getElementById('login-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    btn.disabled = true;

    try {
        // First get CSRF token
        await fetch('/api/scanner/csrf-token/');

        const res = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Login successful! Welcome back 🌾', 'success');
            enterDashboard(data.user);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (e) {
        showToast('Connection error. Is the server running?', 'error');
        console.error('Login error:', e);
    } finally {
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        btn.disabled = false;
    }
}

async function handleSignup() {
    const fullName = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const location = document.getElementById('reg-location').value.trim();

    if (!username || !email || !password) {
        showToast('Username, email and password are required', 'warning');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
    }

    const btn = document.getElementById('signup-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;

    try {
        await fetch('/api/scanner/csrf-token/');

        const res = await fetch('/api/auth/signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ username, email, password, fullName, phone, location })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Account created! Welcome 🌱', 'success');
            enterDashboard(data.user);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (e) {
        showToast('Connection error. Is the server running?', 'error');
        console.error('Signup error:', e);
    } finally {
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        btn.disabled = false;
    }
}

function enterDashboard(user) {
    // Save to localStorage for session persistence
    try {
        localStorage.setItem('agriUser', JSON.stringify(user));
    } catch (e) {
        console.error('LocalStorage error:', e);
    }

    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-wrapper').style.display = 'flex';

    const displayName = user.full_name || user.username || 'Farmer';
    document.getElementById('user-display-name').innerText = displayName;
    document.getElementById('welcome-msg').innerHTML = `🌾 Hello, <b>${displayName.split(' ')[0]}</b>! 👋`;

    // Show weather alert
    setTimeout(() => {
        const alert = document.getElementById('weather-alert');
        if (alert) alert.style.display = 'flex';
    }, 1000);

    // Initial data fetch
    loadDashboardData(); 
    fetchStats(); // Keep this if you have a separate analytics endpoint
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() }
        });
    } catch (e) {
        console.error('Logout error:', e);
    }
    localStorage.removeItem('agriUser');
    location.reload();
}

// ─── Auto-Login Check on Page Load ───
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check with backend if session is still valid
        const res = await fetch('/api/auth/check/');
        const data = await res.json();

        if (data.authenticated) {
            enterDashboard(data.user);
            return;
        }
    } catch (e) {
        console.log('Auth check failed, trying localStorage...');
    }

    // Fallback: check localStorage
    const saved = localStorage.getItem('agriUser');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            enterDashboard(user);
            return;
        } catch (e) { /* invalid JSON */ }
    }

    // Show login screen
    document.getElementById('app-wrapper').style.display = 'none';
    document.getElementById('login-container').style.display = 'flex';

    // Fetch CSRF token for login/signup forms
    try { await fetch('/api/scanner/csrf-token/'); } catch (e) { /* server might not be ready */ }
});

// ═══════════════════════════════════════════
// DASHBOARD & DATA FETCHING
// ═══════════════════════════════════════════

// Fetch stats from DB and populate Dashboard + History
function loadDashboardData() {
    fetch('/api/dashboard-stats/') 
        .then(response => {
            if (!response.ok) throw new Error("Not logged in or server error");
            return response.json();
        })
        .then(data => {
            // 1. UPDATE DASHBOARD CARDS
            if(document.getElementById('stat-total')) document.getElementById('stat-total').innerText = data.total_scans;
            if(document.getElementById('stat-healthy')) document.getElementById('stat-healthy').innerText = data.healthy_count;
            if(document.getElementById('stat-infected')) document.getElementById('stat-infected').innerText = data.infected_count;
            if(document.getElementById('stat-efficiency')) document.getElementById('stat-efficiency').innerText = data.efficiency;

            // 2. UPDATE HISTORY TAB
            const historyContainer = document.getElementById('history-container');
            
            if (historyContainer && data.recent_scans && data.recent_scans.length > 0) {
                historyContainer.innerHTML = ''; // Clear default "No scans yet" message
                
                data.recent_scans.forEach(scan => {
                    // Decide colors based on is_healthy boolean
                    let statusColor = scan.is_healthy ? '#10b981' : '#ef4444'; // Green or Red
                    let statusText = scan.is_healthy ? 'Healthy' : 'Infected';
                    let icon = scan.is_healthy ? 'fa-check-circle' : 'fa-bug';
                    
                    // Create formatted remedy data for the modal
                    let remedyData = scan.is_healthy 
                        ? JSON.stringify([{ icon: '✅', heading: 'Healthy', points: ['Your crop is in excellent condition'] }])
                        : JSON.stringify([{ icon: '💊', heading: 'Treatment', points: [
                            scan.reference_detail ? scan.reference_detail.treatment_options : 'Consult expert',
                            scan.reference_detail ? scan.reference_detail.how_to_recognize : ''
                        ] }]);

                    // We use the addToHistory helper to properly attach click events for the modal
                    addToHistory(
                        `${scan.disease}`, 
                        scan.image_url || '/static/assets/placeholder-leaf.png', 
                        scan.is_healthy ? 'safe' : 'danger', 
                        remedyData,
                        scan.date
                    );
                });
            }
        })
        .catch(error => console.log("Dashboard data fetch skipped:", error));
}


let chartWeekly, chartTrend, chartHealth;
let stats = { total: 0, healthy: 0, infected: 0 };

function showPage(pid) {
    document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.menu a').forEach(e => e.classList.remove('active'));

    const view = document.getElementById(pid + '-view');
    const nav = document.getElementById('nav-' + pid);
    if (view) view.classList.add('active');
    if (nav) nav.classList.add('active');

    const titles = {
        dashboard: 'Dashboard', scanner: 'AI Scanner', analytics: 'Analytics',
        history: 'Scan History', assistant: 'AI Assistant', mandi: 'Mandi Rates', profile: 'User Profile'
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.innerText = titles[pid] || 'Fasal AI Protector';
    document.title = (titles[pid] || 'Home') + ' — Fasal AI Protector';

    if (pid === 'profile') {
        const saved = localStorage.getItem('agriUser');
        if (saved) {
            try {
                const user = JSON.parse(saved);
                document.getElementById('prof-name').value = user.full_name || '';
                document.getElementById('prof-email').value = user.email || '';
                document.getElementById('prof-phone').value = user.phone || '';
                document.getElementById('prof-location').value = user.location || '';
            } catch (e) {}
        }
    }
    
    // Refresh dashboard data when navigating to dashboard or history
    if (pid === 'dashboard' || pid === 'history') {
        loadDashboardData();
    }

    if (pid !== 'scanner') stopCamera();

    // Mobile: close sidebar
    if (window.innerWidth <= 900) {
        document.body.classList.remove('sidebar-toggled');
    }
}

// ─── Theme Toggle ───
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const ico = document.getElementById('theme-icon');
    const isDark = document.body.classList.contains('dark-theme');
    ico.classList.replace(isDark ? 'fa-moon' : 'fa-sun', isDark ? 'fa-sun' : 'fa-moon');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Restore saved theme
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        const ico = document.getElementById('theme-icon');
        if (ico) ico.classList.replace('fa-moon', 'fa-sun');
    }
});

// ─── Charts ───
async function fetchStats() {
    try {
        const res = await fetch('/api/scanner/analytics/');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.success) {
            stats = data.stats;
            initCharts(data.weekly);
            // updateStatCards() is now handled by loadDashboardData(), but keeping this for safety
            updateStatCards(); 
        }
    } catch (e) {
        console.log('Analytics fetch skipped:', e.message);
    }
}

function updateStatCards() {
    const totalEl = document.getElementById('stat-total');
    const healthyEl = document.getElementById('stat-healthy');
    const infectedEl = document.getElementById('stat-infected');
    const effEl = document.getElementById('stat-efficiency');

    // Only update if not already updated by loadDashboardData
    if (totalEl && totalEl.innerText === '0') totalEl.innerText = stats.total.toLocaleString();
    if (healthyEl && healthyEl.innerText === '0') healthyEl.innerText = stats.healthy.toLocaleString();
    if (infectedEl && infectedEl.innerText === '0') infectedEl.innerText = stats.infected.toLocaleString();
    if (effEl && stats.total > 0 && effEl.innerText === '—') {
        effEl.innerText = Math.round((stats.healthy / stats.total) * 100) + '%';
    }
}

function initCharts(weeklyData = { labels: [], data: [] }) {
    if (chartWeekly) chartWeekly.destroy();
    if (chartTrend) chartTrend.destroy();
    if (chartHealth) chartHealth.destroy();

    const opt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

    const weeklyCanvas = document.getElementById('weeklyChart');
    if (weeklyCanvas) {
        chartWeekly = new Chart(weeklyCanvas, {
            type: 'bar',
            data: {
                labels: weeklyData.labels.length ? weeklyData.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Scans',
                    data: weeklyData.data.length ? weeklyData.data : [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(0, 176, 155, 0.7)',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: { ...opt, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
        });
    }

    const trendCanvas = document.getElementById('trendChart');
    if (trendCanvas) {
        chartTrend = new Chart(trendCanvas, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Issues',
                    data: [stats.infected || 0, Math.max(0, (stats.infected || 0) - 5), Math.max(0, (stats.infected || 0) + 3), stats.infected || 0],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444'
                }]
            },
            options: opt
        });
    }

    const healthCanvas = document.getElementById('healthChart');
    if (healthCanvas) {
        chartHealth = new Chart(healthCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Infected'],
                datasets: [{
                    data: [Math.max(stats.healthy, 1), Math.max(stats.infected, 0)],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: { ...opt, cutout: '65%' }
        });
    }
}

// ─── Fertilizer Calculator ───
function calculateFertilizer() {
    const crop = document.getElementById('calc-crop').value;
    const size = parseFloat(document.getElementById('calc-area').value);
    const unit = document.getElementById('calc-unit').value;

    if (!size || size <= 0) {
        showToast('Please enter a valid field size', 'warning');
        document.getElementById('calc-area').focus();
        return;
    }

    let acres = 0;
    const conversions = { acre: 1, hectare: 2.47, bigha: 0.62, biswa: 0.03, dismil: 0.01, manda: 0.025 };
    acres = size * (conversions[unit] || 0.01);

    const cropData = {
        wheat: { u: 45, d: 25 }, paddy: { u: 50, d: 20 }, bajra: { u: 30, d: 15 }, maize: { u: 40, d: 25 },
        sugarcane: { u: 90, d: 50 }, mustard: { u: 35, d: 20 }, potato: { u: 60, d: 40 }, tomato: { u: 45, d: 30 },
        brinjal: { u: 40, d: 30 }, okra: { u: 35, d: 20 }, chilli: { u: 40, d: 30 }, cauliflower: { u: 50, d: 30 }
    };

    const { u = 40, d = 20 } = cropData[crop] || {};
    document.getElementById('res-urea').innerText = (u * acres).toFixed(1);
    document.getElementById('res-dap').innerText = (d * acres).toFixed(1);
    document.getElementById('calc-result').style.display = 'block';

    try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#00b09b', '#96c93d'] }); } catch (e) { }
}

document.addEventListener('DOMContentLoaded', () => {
    const unitEl = document.getElementById('calc-unit');
    if (unitEl) {
        unitEl.addEventListener('change', function () {
            const name = this.options[this.selectedIndex].text.split(' ')[0];
            document.getElementById('calc-area-label').innerText = `Size (in ${name})`;
        });
    }
});

// ═══════════════════════════════════════════
// SCANNER
// ═══════════════════════════════════════════

let vStream = null;
const vid = document.getElementById('video-feed');

function switchScanTab(tabId, btn) {
    document.querySelectorAll('.input-area, .drop-zone').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('.scan-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    const el = document.getElementById(tabId);
    if (el) el.classList.add('show');
    if (btn) btn.classList.add('active');
    if (tabId !== 'camera-area') stopCamera();
}

function stopCamera() {
    if (vStream) {
        vStream.getTracks().forEach(t => t.stop());
        if (vid) vid.style.display = 'none';
        vStream = null;
    }
}

async function startCamera() {
    try {
        vStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        vid.srcObject = vStream;
        vid.style.display = 'block';
        document.getElementById('start-cam-btn').style.display = 'none';
        document.getElementById('capture-btn').style.display = 'inline-block';
    } catch (e) {
        showToast('Camera access denied or unavailable', 'error');
    }
}

function captureImage() {
    const cvs = document.getElementById('canvas');
    cvs.width = vid.videoWidth;
    cvs.height = vid.videoHeight;
    cvs.getContext('2d').drawImage(vid, 0, 0);
    showPreview(cvs.toDataURL());
    stopCamera();
    document.getElementById('start-cam-btn').style.display = 'inline-block';
    document.getElementById('capture-btn').style.display = 'none';
}

function handleFile(input) {
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => showPreview(e.target.result);
        reader.readAsDataURL(input.files[0]);
    }
}

function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => showPreview(ev.target.result);
        reader.readAsDataURL(file);
    }
}

function loadUrl() {
    const v = document.getElementById('url-input').value;
    if (v) showPreview(v);
}

function showPreview(src) {
    document.getElementById('preview-img').src = src;
    document.getElementById('preview-box').style.display = 'block';
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('result-placeholder').style.display = 'flex';
}

function clearScanPreview() {
    document.getElementById('preview-box').style.display = 'none';
    document.getElementById('preview-img').src = '';
    document.getElementById('result-box').style.display = 'none';
    document.getElementById('result-placeholder').style.display = 'flex';
    const fi = document.getElementById('file-input');
    if (fi) fi.value = '';
}

async function runPrediction() {
    const btn = document.getElementById('predict-btn');
    const overlay = document.getElementById('scan-overlay');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    btn.disabled = true;
    if (overlay) overlay.style.display = 'flex';

    try {
        const imgElement = document.getElementById('preview-img');
        if (!imgElement.src || imgElement.src === window.location.href) {
            showToast('Please select an image first', 'warning');
            return;
        }

        const res = await fetch(imgElement.src);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append('leaf_image', blob, 'scan.jpg'); // Changed to leaf_image to match your view
        formData.append('location', 'Lucknow, UP');

        // Note: Using the new process_leaf_scan endpoint which saves automatically
        const apiRes = await fetch('/api/scanner/process_leaf_scan/', { 
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() },
            body: formData
        });

        if (!apiRes.ok) throw new Error(`Server Error: ${apiRes.status}`);
        const result = await apiRes.json();
        if (result.error) throw new Error(result.error);

        // Parse result (Update these to match the dict returned by your utils.py)
        const isHealthy = result.status && result.status.toLowerCase() === 'healthy';
        const diseaseName = result.disease_detected || result.top_disease || 'Unknown';
        const cropName = result.crop_name || result.top_crop || 'Unknown';
        const confidence = result.confidence_score || result.confidence || 0;
        const treatments = result.treatments || [];

        // Hide placeholder, show result
        document.getElementById('result-placeholder').style.display = 'none';
        document.getElementById('result-box').style.display = 'block';

        // Update UI
        const title = document.getElementById('pest-name');
        title.style.color = isHealthy ? 'var(--success)' : 'var(--danger)';
        title.innerText = isHealthy ? `${cropName} — Healthy ✅` : `${cropName} — ${diseaseName}`;

        document.getElementById('result-crop-label').innerText = `${cropName} • ${isHealthy ? 'No Disease' : 'Disease Detected'}`;

        // Confidence bar
        const pct = Math.round(confidence * 100);
        document.getElementById('confidence-value').innerText = pct + '%';
        document.getElementById('confidence-fill').style.width = pct + '%';

        // Severity
        const badge = document.getElementById('severity-badge');
        if (isHealthy) {
            badge.innerText = 'Healthy';
            badge.style.background = 'var(--success-light)';
            badge.style.color = 'var(--success)';
        } else if (confidence > 0.8) {
            badge.innerText = 'High';
            badge.style.background = 'var(--danger-light)';
            badge.style.color = 'var(--danger)';
        } else if (confidence > 0.5) {
            badge.innerText = 'Medium';
            badge.style.background = 'var(--warning-light)';
            badge.style.color = 'var(--warning)';
        } else {
            badge.innerText = 'Low';
            badge.style.background = 'var(--success-light)';
            badge.style.color = 'var(--success)';
        }

        // Result icon
        const icon = document.getElementById('result-icon');
        if (isHealthy) {
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            icon.style.background = 'var(--success-light)';
            icon.style.color = 'var(--success)';
        } else {
            icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            icon.style.background = 'var(--danger-light)';
            icon.style.color = 'var(--danger)';
        }

        // Treatment text
        const remedyEl = document.getElementById('remedy');
        const organicEl = document.getElementById('remedy-organic');

        if (isHealthy) {
            remedyEl.innerText = 'No treatment required. Your crop is healthy!';
            organicEl.innerText = 'Keep monitoring weekly and maintain good agricultural practices.';
        } else if (treatments.length > 0) {
            const t = treatments[0];
            remedyEl.innerText = t.pesticide_options || t.pesticide || 'Consult a local expert';
            organicEl.innerText = t.application_method || t.application || 'Apply as recommended';
        } else if (result.reference_data) {
            remedyEl.innerText = result.reference_data.treatment_options || 'See reference guide';
            organicEl.innerText = result.reference_data.how_to_recognize || 'Check with expert';
        } else {
            remedyEl.innerText = 'Consult a local agricultural expert for this condition.';
            organicEl.innerText = 'Remove infected parts and improve air circulation.';
        }

        // REFRESH DB DATA (Updates Dashboard numbers & adds to History automatically)
        setTimeout(loadDashboardData, 1000); 

        if (isHealthy) {
            try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#00b09b', '#96c93d'] }); } catch (e) { }
        }

    } catch (e) {
        showToast('Analysis failed: ' + e.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (overlay) overlay.style.display = 'none';
    }
}

// ═══════════════════════════════════════════
// VOICE
// ═══════════════════════════════════════════

function startVoice() {
    const mic = document.getElementById('mic-icon');
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice not supported in this browser', 'warning');
        return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = typeof getVoiceLang === 'function' ? getVoiceLang() : 'hi-IN';
    r.onstart = () => mic.className = 'fas fa-spinner fa-spin';
    r.onresult = (e) => {
        mic.className = 'fas fa-microphone';
        const cmd = e.results[0][0].transcript.toLowerCase();
        if (cmd.includes('scan')) { showPage('scanner'); }
        else if (cmd.includes('dashboard')) { showPage('dashboard'); }
        else if (cmd.includes('analytics') || cmd.includes('chart')) { showPage('analytics'); }
        else if (cmd.includes('history')) { showPage('history'); }
        else if (cmd.includes('assistant') || cmd.includes('chat')) { showPage('assistant'); }
        else { showToast('Voice: ' + cmd, 'info'); }
    };
    r.onerror = () => mic.className = 'fas fa-microphone';
    r.onend = () => mic.className = 'fas fa-microphone';
    r.start();
}

// ═══════════════════════════════════════════
// HISTORY (MODAL HANDLING)
// ═══════════════════════════════════════════

let currentModalData = {};

function addToHistory(title, imgSrc, status, remedy, dateStr) {
    const list = document.getElementById('history-container');
    if (!list) return;

    // Remove empty state
    const emptyState = list.querySelector('div[style*="text-align:center"]');
    if (emptyState) emptyState.remove();

    const card = document.createElement('div');
    card.className = 'history-card';
    // Use the date provided by the DB, or fallback to current time
    const timestamp = dateStr || new Date().toLocaleString();

    card.setAttribute('data-title', title);
    card.setAttribute('data-img', imgSrc);
    card.setAttribute('data-status', status);
    card.setAttribute('data-remedy', remedy || '');
    card.setAttribute('data-date', timestamp);

    const statusText = status === 'safe' ? 'Healthy' : 'Infected';
    
    // Create the card with inline styles similar to what we planned
    card.style.cssText = "background: var(--bg-card); padding: 15px; border-radius: var(--radius-lg); margin-bottom: 12px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-sm); cursor:pointer;";
    
    let statusColor = status === 'safe' ? '#10b981' : '#ef4444';
    let icon = status === 'safe' ? 'fa-check-circle' : 'fa-bug';

    card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="background: ${statusColor}20; color: ${statusColor}; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                <i class="fas ${icon}"></i>
            </div>
            <div>
                <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-main);">${title}</h4>
                <span style="font-size: 0.8rem; color: var(--text-light);"><i class="far fa-calendar-alt"></i> ${timestamp}</span>
            </div>
        </div>
        <div style="text-align: right;">
            <div style="color: ${statusColor}; font-weight: 700; font-size: 0.9rem; text-transform: uppercase;">${statusText}</div>
        </div>`;

    card.onclick = function () {
        openHistoryModal(
            this.getAttribute('data-title'),
            this.getAttribute('data-img'),
            this.getAttribute('data-status'),
            this.getAttribute('data-remedy'),
            this.getAttribute('data-date')
        );
    };

    // We append instead of insertBefore because the API sends them pre-sorted (newest first)
    list.appendChild(card);
}

function openHistoryModal(title, img, status, remedy, date) {
    currentModalData = { title, img, status, remedy, date };

    document.getElementById('modal-img').src = img;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-date').innerText = date;

    const badge = document.getElementById('modal-status');
    badge.innerText = status === 'safe' ? 'Healthy' : 'Infected';
    badge.className = 'status-badge ' + (status === 'safe' ? 'status-safe' : 'status-danger');

    renderRemedy(remedy);

    document.getElementById('history-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function renderRemedy(remedy) {
    const container = document.getElementById('modal-remedy-container');
    try {
        const data = JSON.parse(remedy);
        container.innerHTML = data.map(s =>
            `<div class="remedy-section">
                <h4>${s.icon || '📋'} ${s.heading}</h4>
                <ul>${s.points.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>`
        ).join('');
    } catch (e) {
        container.innerHTML = `<div class="remedy-section"><h4>📋 Treatment</h4><ul><li>${remedy || 'No data available'}</li></ul></div>`;
    }
}

function closeHistoryModal() {
    document.getElementById('history-modal').style.display = 'none';
    document.body.style.overflow = '';
}

function exportCurrentScan() {
    if (typeof exportScanPDF === 'function') {
        exportScanPDF(currentModalData.title, currentModalData.img, currentModalData.status, currentModalData.remedy, currentModalData.date);
    } else {
        showToast('PDF export loading...', 'info');
    }
}

// ═══════════════════════════════════════════
// MOBILE SIDEBAR
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('button[aria-label="Menu"]');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                document.body.classList.toggle('sidebar-open');
            }
        });
    }

    // Close sidebar on outside click
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 900 && sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        }
    });
});

// ═══════════════════════════════════════════
// LANGUAGE
// ═══════════════════════════════════════════

function toggleLanguageMenu() {
    const menu = document.getElementById('lang-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close language menu on outside click
document.addEventListener('click', function(e) {
    const langSelector = document.getElementById('lang-selector');
    const langMenu = document.getElementById('lang-menu');
    if (langSelector && langMenu) {
        if (!langSelector.contains(e.target)) {
            langMenu.style.display = 'none';
        }
    }
});

// ═══════════════════════════════════════════
// USER PROFILE & PINCODE
// ═══════════════════════════════════════════

async function fetchLocationFromPincode(pincode, targetFieldId) {
    pincode = pincode.trim();
    if (pincode.length !== 6) return;
    try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0];
            const locStr = `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`;
            const targetEl = document.getElementById(targetFieldId);
            if (targetEl && !targetEl.value) {
                targetEl.value = locStr;
                showToast(`Location fetched: ${locStr}`, 'success');
            }
        }
    } catch (e) {
        console.error('Failed to fetch location:', e);
    }
}

async function updateProfile() {
    const fullName = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const location = document.getElementById('prof-location').value.trim();
    
    const btn = document.getElementById('update-profile-btn');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/auth/profile/update/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ fullName, phone, location })
        });
        
        const data = await res.json();
        if (data.success) {
            showToast('Profile updated!', 'success');
            
            // update local storage
            let saved = localStorage.getItem('agriUser');
            if (saved) {
                let user = JSON.parse(saved);
                user.full_name = fullName;
                user.phone = phone;
                user.location = location;
                localStorage.setItem('agriUser', JSON.stringify(user));
                
                // update header displayName
                const displayName = user.full_name || user.username || 'Farmer';
                const dispEl = document.getElementById('user-display-name');
                if(dispEl) dispEl.innerText = displayName;
            }
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (e) {
        showToast('Error updating profile', 'error');
    } finally {
        btn.innerHTML = oldHtml;
        btn.disabled = false;
    }
}

async function deleteProfileConfirm() {
    if (confirm("Are you absolutely sure you want to delete your Fasal AI Protector account? This action cannot be undone.")) {
        try {
            const res = await fetch('/api/auth/profile/delete/', {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            });
            const data = await res.json();
            if (data.success) {
                alert("Your account has been deleted.");
                localStorage.removeItem('agriUser');
                window.location.reload();
            } else {
                showToast(data.message || 'Failed to delete account', 'error');
            }
        } catch (e) {
            showToast('Connection error.', 'error');
        }
    }
}

document.addEventListener('click', (e) => {
    const selector = document.getElementById('lang-selector');
    const menu = document.getElementById('lang-menu');
    if (selector && menu && !selector.contains(e.target)) {
        menu.style.display = 'none';
    }
});