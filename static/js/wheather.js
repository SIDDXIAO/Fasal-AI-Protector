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
    if (alertBox) alertBox.style.display = 'none';
});