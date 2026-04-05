
function fetchLiveWeather() {
    if (navigator.geolocation) {
        // Show the widget in a "loading" state
        document.getElementById('weather-card').style.display = 'block';
        document.getElementById('w-location').innerText = "Fetching coordinates...";

        // Request live location
        navigator.geolocation.getCurrentPosition(sendToDjango, handleGeoError);
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

function sendToDjango(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    document.getElementById('w-location').innerText = "Analyzing weather...";

    // Call your Django API
    fetch(`/api/get-weather/?lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                document.getElementById('weather-card').style.display = 'none';
                return;
            }

            // Populate the UI with real data
            document.getElementById('w-location').innerText = data.location;
            document.getElementById('w-temp').innerText = data.temperature + "°C";
            document.getElementById('w-desc').innerText = data.description;
            document.getElementById('w-humidity').innerText = data.humidity;
            document.getElementById('w-wind').innerText = data.wind_speed;

            // Fetch the official OpenWeather icon
            document.getElementById('w-icon').src = `https://openweathermap.org/img/wn/${data.icon_code}@2x.png`;
        })
        .catch(error => console.error('Error:', error));
}

function handleGeoError(error) {
    document.getElementById('weather-card').style.display = 'none';
    if (error.code === 1) {
        alert("Please allow location access to see local weather.");
    } else {
        alert("Could not detect your live location.");
    }
}
