# 🌱 Fasal AI Protector

![Fasal AI Banner](https://via.placeholder.com/1200x400/00b09b/ffffff?text=Fasal+AI+Protector+-+Smart+Crop+Disease+Detection)

**Fasal AI Protector** is a smart, AI-powered agricultural assistant built to empower farmers with early crop disease detection, localized treatment recommendations, live weather updates, and real-time Mandi (market) rates. 

Built specifically with Indian farmers in mind, it bridges the gap between advanced Deep Learning (Vision Transformers) and accessible, multilingual agricultural advisory.

---

## ✨ Key Features

* **🔍 AI Disease Scanner:** Upload or capture a leaf image. Our ViT (Vision Transformer) model instantly detects over 38+ plant diseases with 92%+ accuracy.
* **💊 Smart Treatment Plans:** Get immediate, highly localized chemical and organic treatment recommendations cross-referenced with a comprehensive agricultural database.
* **🌦️ Live Weather & Alerts:** Real-time weather tracking via OpenWeather API, providing localized farming alerts (e.g., "Delay irrigation due to heavy rain").
* **📈 Real-time Mandi Rates:** Fetch the latest crop prices across Uttar Pradesh markets so farmers get the best value for their yield.
* **🧪 Fertilizer Calculator:** Input your field size (Acre, Hectare, Bigha, Dismil) and crop type to get exact Urea and DAP dosage recommendations.
* **📚 Scan History & Analytics:** Track the health of your farm over time with a dedicated user dashboard, visual charts, and downloadable PDF reports.
* **🌐 Multilingual Support:** Accessible in English, Hindi (हिंदी), Bhojpuri (भोजपुरी), Punjabi (ਪੰਜਾਬੀ), and Marathi (मराठी).

---

## 🛠️ Technology Stack

* **Backend:** Python, Django, Django REST Framework
* **Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js
* **Machine Learning:** PyTorch / TensorFlow (Vision Transformers)
* **Database:** PostgreSQL / SQLite
* **APIs:** OpenWeather API, Indian Gov Mandi Prices API / Web Scraping

---

## 🚀 Local Installation & Setup

Follow these steps to run the Fasal AI Protector on your local machine.

### Prerequisites
* Python 3.9+
* Git
* Virtual Environment (`venv`)

### Steps

1. **Clone the repository**
   ```bash
   git clone [https://github.com/SIDDXIAO/Fasal-AI-Protector.git](https://github.com/SIDDXIAO/Fasal-AI-Protector.git)
   cd Fasal-AI-Protector
