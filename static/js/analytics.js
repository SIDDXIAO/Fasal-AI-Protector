// Fasal AI Analytics - Dark Theme Dashboard JS

document.addEventListener('DOMContentLoaded', () => {
    initAnalyticsCharts();
});

let analyticsBarChartInstance = null;
let analyticsDonutChartInstance = null;

function initAnalyticsCharts() {
    // 1. Weekly Scan Overview (Bar Chart)
    const barCtx = document.getElementById('analyticsBarChart');
    if (barCtx) {
        analyticsBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Scans',
                    data: [120, 150, 180, 170, 250, 140, 110],
                    backgroundColor: function(context) {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, '#3b82f6'); // blue
                        gradient.addColorStop(1, '#8b5cf6'); // purple
                        return gradient;
                    },
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 5, bottom: 0, left: 5, right: 5 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
                        ticks: { color: '#666', font: { size: 11 } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#666', font: { size: 11 } }
                    }
                }
            }
        });
    }

    // 2. Disease Categories (Donut Chart)
    const donutCtx = document.getElementById('analyticsDonutChart');
    if (donutCtx) {
        analyticsDonutChartInstance = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Blight', 'Rust', 'Mildew', 'Other'],
                datasets: [{
                    data: [142, 98, 64, 73],
                    backgroundColor: [
                        '#00b09b', // Fasal Green
                        '#96c93d', // Light Green
                        '#ef4444', // Red
                        '#f59e0b'  // Amber
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderWidth: 1
                    }
                }
            },
            plugins: [{
                id: 'textCenter',
                beforeDraw: function(chart) {
                    var width = chart.width, height = chart.height, ctx = chart.ctx;
                    ctx.restore();
                    var fontSize = (height / 100).toFixed(2);
                    ctx.font = "bold " + fontSize + "em sans-serif";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#333333";
                    var text = (chart._totalDiseases !== undefined ? chart._totalDiseases : 0).toString(),
                        textX = Math.round((width - ctx.measureText(text).width) / 2),
                        textY = height / 2 - 5;
                    ctx.fillText(text, textX, textY);
                    
                    ctx.font = "normal " + (fontSize * 0.4).toFixed(2) + "em sans-serif";
                    ctx.fillStyle = "#666666";
                    var text2 = "Total",
                        text2X = Math.round((width - ctx.measureText(text2).width) / 2),
                        text2Y = height / 2 + 15;
                    ctx.fillText(text2, text2X, text2Y);
                    ctx.save();
                }
            }]
        });
    }
}

// Generate AI Insight based on top boxes
async function generateAnalyticsInsight() {
    const insightBox = document.getElementById('analytics-ai-insight');
    const insightText = document.getElementById('ai-insight-text');
    
    if (!insightBox || !insightText) return;
    
    insightBox.style.display = 'block';
    insightText.innerHTML = 'Generating analysis <i class="fas fa-spinner fa-spin"></i>';
    
    // Construct the prompt using the stats from the UI
    const total = document.getElementById('analytics-stat-total')?.innerText || '0';
    const infected = document.getElementById('analytics-stat-infected')?.innerText || '0';
    const healthyRate = document.getElementById('analytics-stat-healthy-rate')?.innerText || '0%';

    const prompt = `Analyze these agricultural platform statistics briefly (2-3 sentences max) and provide an encouraging insight: 
    Total Scans: ${total}; 
    Diseases Blocked: ${infected}; 
    Healthy Crop Rate: ${healthyRate}.`;

    try {
        const response = await fetch('/api/assistant/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') || ''
            },
            body: JSON.stringify({ message: prompt, lang: 'en-IN' })
        });

        if (!response.ok) throw new Error('API Error');

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        insightText.innerHTML = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            
            // Clean up typical LLM markdown
            let cleanChunk = chunk.replace(/\*\*/g, '<b>').replace(/\*/g, '');
            insightText.innerHTML += cleanChunk;
        }

    } catch (e) {
        console.error("AI Insight Error:", e);
        insightText.innerHTML = "Fasal AI is currently analyzing your data in the background. Please try again later.";
    }
}

// Utility for CSRF
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Dynamically update charts from backend data
window.updateAnalyticsTabCharts = function(weeklyData, healthData, scans) {
    if (!weeklyData || !weeklyData.labels) return;

    // Store real data for chart switching
    weeklyScansData = weeklyData.data || [0,0,0,0,0,0,0];
    
    // Calculate diseases and healthy from scans data
    if (scans && scans.length > 0) {
        // Group scans by day of week
        const dayCounts = {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []};
        scans.forEach(scan => {
            const date = new Date(scan.date);
            const day = date.getDay();
            if (!dayCounts[day]) dayCounts[day] = [];
            dayCounts[day].push(scan.is_healthy);
        });
        
        // Calculate daily disease and healthy counts
        weeklyDiseasesData = weeklyData.labels.map((_, i) => {
            const dayScans = dayCounts[i] || [];
            return dayScans.filter(s => !s).length;
        });
        
        weeklyHealthyData = weeklyData.labels.map((_, i) => {
            const dayScans = dayCounts[i] || [];
            return dayScans.filter(s => s).length;
        });
    } else {
        // Fallback: estimate from total
        weeklyDiseasesData = weeklyScansData.map(v => Math.floor(v * 0.3));
        weeklyHealthyData = weeklyScansData.map(v => Math.floor(v * 0.7));
    }

    // 1. Update Bar Chart
    if (analyticsBarChartInstance) {
        analyticsBarChartInstance.data.labels = weeklyData.labels;
        analyticsBarChartInstance.data.datasets[0].data = weeklyScansData;
        analyticsBarChartInstance.update();
    }

    // 2. Process scans for Donut Chart (Disease Categories)
    const diseaseCounts = {};
    let totalDiseases = 0;
    
    if (scans && scans.length > 0) {
        scans.forEach(scan => {
            if (!scan.is_healthy) {
                const name = scan.disease_name || 'Unknown';
                diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
                totalDiseases++;
            }
        });
    }

    // Convert to sorted array
    const sortedDiseases = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1]);
    
    // Fallback if no diseases
    const hasDiseases = sortedDiseases.length > 0;
    const labels = hasDiseases ? sortedDiseases.map(d => d[0]) : ['No Diseases'];
    const data = hasDiseases ? sortedDiseases.map(d => d[1]) : [1];
    const bgColors = ['#00b09b', '#96c93d', '#ef4444', '#f59e0b', '#8b5cf6', '#14b8a6', '#6366f1'];
    
    // Update Donut Chart
    if (analyticsDonutChartInstance) {
        analyticsDonutChartInstance.data.labels = labels;
        analyticsDonutChartInstance.data.datasets[0].data = data;
        // Update center text using plugin modification
        analyticsDonutChartInstance._totalDiseases = totalDiseases;
        analyticsDonutChartInstance.update();
    }

    // 3. Update Legend
    const legendContainer = document.getElementById('analytics-disease-legend');
    if (legendContainer) {
        if (!hasDiseases) {
            legendContainer.innerHTML = '<div style="text-align:center; color:var(--text-light); font-size:0.85rem; padding: 10px;">No disease data available yet</div>';
        } else {
            let html = '';
            sortedDiseases.forEach((d, index) => {
                const color = bgColors[index % bgColors.length];
                const count = d[1];
                const percentage = Math.round((count / totalDiseases) * 100);
                html += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem;">
                    <span style="color: var(--text-secondary);"><i class="fas fa-circle" style="color: ${color}; font-size: 0.6rem; margin-right: 6px;"></i> ${d[0]}</span>
                    <strong style="color: var(--text-main);">${count} <span style="color: var(--text-light); font-weight: normal; margin-left: 8px;">${percentage}%</span></strong>
                </div>`;
            });
            legendContainer.innerHTML = html;
        }
    }
};

// Chart data switcher for Scans/Diseases/Healthy buttons
let currentChartType = 'scans';
let weeklyScansData = null;
let weeklyDiseasesData = null;
let weeklyHealthyData = null;

window.switchChartData = function(type) {
    currentChartType = type;
    
    // Update button styles
    const btnScans = document.getElementById('btn-scans');
    const btnDiseases = document.getElementById('btn-diseases');
    const btnHealthy = document.getElementById('btn-healthy');
    
    const activeStyle = 'background: linear-gradient(135deg, #00b09b, #96c93d); color: white; border: none; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; cursor: pointer;';
    const inactiveStyle = 'background: #f1f5f9; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; cursor: pointer;';
    
    if (btnScans) btnScans.style = type === 'scans' ? activeStyle : inactiveStyle;
    if (btnDiseases) btnDiseases.style = type === 'diseases' ? activeStyle : inactiveStyle;
    if (btnHealthy) btnHealthy.style = type === 'healthy' ? activeStyle : inactiveStyle;
    
    // Update chart data with real database values
    if (analyticsBarChartInstance) {
        let newData;
        let newColor;
        
        if (type === 'scans' && weeklyScansData) {
            newData = weeklyScansData;
            newColor = function(context) {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#8b5cf6');
                return gradient;
            };
        } else if (type === 'diseases' && weeklyDiseasesData) {
            newData = weeklyDiseasesData;
            newColor = function(context) {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, '#ef4444');
                gradient.addColorStop(1, '#f97316');
                return gradient;
            };
        } else if (type === 'healthy' && weeklyHealthyData) {
            newData = weeklyHealthyData;
            newColor = function(context) {
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, '#00b09b');
                gradient.addColorStop(1, '#96c93d');
                return gradient;
            };
        } else {
            // If no data, use default empty data
            newData = [0, 0, 0, 0, 0, 0, 0];
            newColor = '#94a3b8';
        }
        
        analyticsBarChartInstance.data.datasets[0].data = newData;
        analyticsBarChartInstance.data.datasets[0].backgroundColor = newColor;
        analyticsBarChartInstance.update();
    }
};

// Store real weekly data for chart switching
window.setWeeklyChartData = function(scansData, diseasesData, healthyData) {
    weeklyScansData = scansData;
    weeklyDiseasesData = diseasesData;
    weeklyHealthyData = healthyData;
};

// Initialize - fetch real data
document.addEventListener('DOMContentLoaded', function() {
    // Fetch real weekly data from backend
    fetch('/api/scanner/analytics/', { credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.weekly) {
                // Store real data
                weeklyScansData = data.weekly.data || [0,0,0,0,0,0,0];
                
                // Calculate diseases (infected scans)
                if (data.weekly.data) {
                    weeklyDiseasesData = data.weekly.data.map(v => Math.floor(v * 0.3)); // Estimate 30%
                    weeklyHealthyData = data.weekly.data.map(v => Math.floor(v * 0.7)); // Estimate 70%
                }
                
                // Set default view
                if (document.getElementById('btn-scans')) {
                    switchChartData('scans');
                }
            }
        })
        .catch(err => console.log('Chart data fetch error:', err));
});
