<<<<<<< HEAD
let weatherDataCache = null;

=======
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
function fetchLiveWeather() {
    if (navigator.geolocation) {
        document.getElementById('weather-card').style.display = 'block';
        document.getElementById('w-location').innerText = "Fetching coordinates...";
        navigator.geolocation.getCurrentPosition(sendToDjango, handleGeoError);
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

function sendToDjango(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    document.getElementById('w-location').innerText = "Analyzing weather...";

    fetch(`/api/weather/get-weather/?lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                document.getElementById('weather-card').style.display = 'none';
                return;
            }

<<<<<<< HEAD
            weatherDataCache = data;

=======
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
            // Populate weather card
            document.getElementById('w-location').innerText = data.location;
            document.getElementById('w-temp').innerText = data.temperature + "°C";
            document.getElementById('w-desc').innerText = data.description;
            document.getElementById('w-humidity').innerText = data.humidity;
            document.getElementById('w-wind').innerText = data.wind_speed;
            document.getElementById('w-icon').src = `https://openweathermap.org/img/wn/${data.icon_code}@2x.png`;

            // Update weather alert dynamically
            updateWeatherAlert(data);
        })
        .catch(error => console.error('Weather fetch error:', error));
}

<<<<<<< HEAD
function showWeatherDashboard() {
    if (!weatherDataCache) {
        alert("Please click 'Live Weather' first to fetch weather data.");
        fetchLiveWeather();
        return;
    }

    const modal = document.getElementById('weather-dashboard-modal');
    modal.style.display = 'block';

    const data = weatherDataCache;

    // Current weather
    document.getElementById('wd-location').innerText = data.location;
    document.getElementById('wd-temp').innerText = data.temperature + "°C";
    document.getElementById('wd-desc').innerText = data.description;
    document.getElementById('wd-humidity').innerText = data.humidity || '--';
    document.getElementById('wd-wind').innerText = data.wind_speed || '--';
    document.getElementById('wd-icon').src = data.icon_code ? `https://openweathermap.org/img/wn/${data.icon_code}@2x.png` : '';

    // Sunrise/Sunset
    if (data.sunrise) {
        document.getElementById('wd-sunrise').innerText = new Date(data.sunrise * 1000).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});
    }
    if (data.sunset) {
        document.getElementById('wd-sunset').innerText = new Date(data.sunset * 1000).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});
    }

    // Extra details
    document.getElementById('wd-humidity-detail').innerText = `Humidity: ${data.humidity || '--'}%`;
    document.getElementById('wd-wind-detail').innerText = `Wind: ${data.wind_speed || '--'} m/s`;
    document.getElementById('wd-rain-detail').innerText = data.rain_probability ? `${data.rain_probability}%` : 'Low';

    // Generate 7-day forecast (mock data based on current)
    const forecastContainer = document.getElementById('weather-forecast');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const icons = ['01d', '02d', '03d', '04d', '10d', '09d', '11d'];
    const descs = ['Clear', 'Cloudy', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Rain', 'Thunder'];
    const temps = [data.temperature || 25, 24, 26, 25, 23, 24, 26];
    const minTemps = [18, 17, 19, 18, 16, 17, 19];

    let forecastHTML = '';
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        const dayName = i === 0 ? 'Today' : days[nextDay.getDay()];

        forecastHTML += `
            <div style="background: linear-gradient(135deg, rgba(0,176,155,0.1), rgba(150,201,61,0.05)); border: 1px solid rgba(0,176,155,0.2); padding:18px 12px; border-radius:14px; text-align:center; transition: all 0.2s; cursor:pointer;">
                <div style="font-weight:700; font-size:0.9rem; margin-bottom:10px; color:white;">${dayName}</div>
                <img src="https://openweathermap.org/img/wn/${icons[i % icons.length]}@2x.png" style="width:55px; height:55px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <div style="font-size:1.4rem; font-weight:800; color:white; margin-top:8px;">${temps[i]}°</div>
                <div style="font-size:0.9rem; color:rgba(255,255,255,0.6);">${minTemps[i]}°</div>
                <div style="font-size:0.75rem; margin-top:8px; color:rgba(255,255,255,0.7); background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">${descs[i % descs.length]}</div>
            </div>
        `;
    }

    forecastContainer.innerHTML = forecastHTML;
}

function closeWeatherDashboard() {
    document.getElementById('weather-dashboard-modal').style.display = 'none';
}

=======
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
function updateWeatherAlert(data) {
    const alertBox = document.getElementById('weather-alert');
    if (!alertBox) return;

    const desc = data.description.toLowerCase();
    const temp = data.temperature;
    const humidity = data.humidity;
    const wind = data.wind_speed;

    let show = false;
    let icon = 'fas fa-cloud-showers-heavy';
    let title = '';
    let message = '';
    let tip = '';

    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
        show = true;
        icon = 'fas fa-cloud-showers-heavy';
        title = 'Rain Alert';
        message = `${data.description} expected. Humidity: ${humidity}%`;
        tip = 'Delay irrigation and cover harvested crops.';
    } else if (desc.includes('thunderstorm') || desc.includes('storm')) {
        show = true;
        icon = 'fas fa-bolt';
        title = 'Thunderstorm Alert';
        message = `${data.description} in your area.`;
        tip = 'Keep livestock sheltered. Avoid open fields.';
    } else if (desc.includes('snow') || desc.includes('sleet') || desc.includes('hail')) {
        show = true;
        icon = 'fas fa-snowflake';
        title = 'Frost/Hail Alert';
        message = `${data.description} conditions detected.`;
        tip = 'Cover sensitive crops with protective netting.';
    } else if (temp >= 42) {
        show = true;
        icon = 'fas fa-thermometer-full';
        title = 'Extreme Heat Alert';
        message = `Temperature is ${temp}°C — very high heat stress on crops.`;
        tip = 'Water crops early morning or late evening only.';
    } else if (wind >= 10) {
        show = true;
        icon = 'fas fa-wind';
        title = 'Strong Wind Alert';
        message = `Wind speed at ${wind} m/s — risk of crop damage.`;
        tip = 'Support tall crops and secure greenhouse covers.';
    } else if (humidity >= 85) {
        show = true;
        icon = 'fas fa-tint';
        title = 'High Humidity Alert';
        message = `Humidity at ${humidity}% — fungal disease risk is high.`;
        tip = 'Apply preventive fungicide and ensure good air circulation.';
    }

    if (show) {
        alertBox.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <i class="${icon}" style="font-size:1.3rem;"></i>
                <div>
                    <strong>${title}:</strong> ${message}
                    <div style="font-size:0.82rem; margin-top:2px;">${tip}</div>
                </div>
            </div>
            <button onclick="document.getElementById('weather-alert').style.display='none'"
                style="background:none; border:none; color:inherit; cursor:pointer; font-size:1.2rem; padding:4px;">&times;</button>
        `;
        alertBox.style.display = 'flex';
    } else {
        alertBox.style.display = 'none';
    }
}

function handleGeoError(error) {
    document.getElementById('weather-card').style.display = 'none';
    if (error.code === 1) {
        alert("Please allow location access to see local weather.");
    } else {
        alert("Could not detect your live location.");
    }
}
// Hide alert on page load — only show after real weather is fetched
document.addEventListener('DOMContentLoaded', function() {
    const alertBox = document.getElementById('weather-alert');
<<<<<<< HEAD
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.innerHTML = '';
    }
=======
    if (alertBox) alertBox.style.display = 'none';
>>>>>>> 169f17db8a37b1a5a0d42a769b91fd8abb1d82c6
});