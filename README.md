# 🌱 Fasal AI Protector

<div align="center">

  <h3>Smart Crop Disease Detection & Farming Assistant</h3>
  <p>AI-powered disease detection, localized treatment plans, and real-time agricultural data for Indian farmers.</p>

  <br/>

  ![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
  ![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)
  ![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square&logo=postgresql&logoColor=white)
  ![License](https://img.shields.io/badge/License-Private-red?style=flat-square)

</div>

---

## ✨ Key Features

* **🔍 AI Disease Scanner:** Upload or capture a leaf image. Our ViT (Vision Transformer) model instantly detects over 38+ plant diseases with **92%+ accuracy.**

* **💊 Smart Treatment Plans:** Get immediate, highly localized chemical and organic treatment recommendations cross-referenced with a comprehensive agricultural database.

* **🌦️ Live Weather & Alerts:** Real-time weather tracking via OpenWeather API, providing localized farming alerts (e.g., *"Delay irrigation due to heavy rain"*).

* **📈 Real-time Mandi Rates:** Fetch the latest crop prices across Uttar Pradesh markets so farmers get the best value for their yield.

* **🧪 Fertilizer Calculator:** Input your field size (Acre, Hectare, Bigha, Dismil) and crop type to get exact Urea and DAP dosage recommendations.

* **📚 Scan History & Analytics:** Track the health of your farm over time with a dedicated user dashboard, visual charts, and downloadable PDF reports.

* **🌐 Multilingual Support:** Accessible in English, Hindi (हिंदी), Bhojpuri (भोजपुरी), Punjabi (ਪੰਜਾਬੀ), and Marathi (मराठी).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, Django 4.2, Django REST Framework |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, TypeScript, Chart.js |
| **Machine Learning** | PyTorch, Vision Transformer (ViT), scikit-learn |
| **LLM / Chatbot** | LangChain, LangGraph, Groq API (Gemma / Mistral) |
| **Database** | PostgreSQL, ChromaDB (Vector DB) |
| **APIs** | OpenWeather API, Indian Gov Mandi Prices API, Web Scraping |
| **Deployment** | Gunicorn, Whitenoise, Nginx |

---

## 📁 Project Structure

```
Fasal-AI-Protector/
├── apps/
│   ├── authentication/      # User login & signup
│   ├── scanner/             # AI disease detection
│   ├── chatbot/             # RAG-powered AI assistant
│   ├── weather/             # Weather API integration
│   └── market/              # Live mandi rates
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── models/
│   └── vit_plant_disease/   # Trained ViT model weights
├── static/                  # CSS, JS, images
├── templates/               # HTML templates
├── zip_analysis/            # Batch image analysis
├── vit_training.py          # Model training script
├── mandi_scraper.py         # Mandi rate scraper
├── crops.json               # Crop reference data
├── .env.example             # Environment config template
├── requirements.txt
└── manage.py
```

---

## 🚀 Local Installation & Setup

Follow these steps to run **Fasal AI Protector** on your local machine.

### Prerequisites

* Python 3.9+
* Git
* PostgreSQL
* Virtual Environment (`venv`)
* LM Studio (for local Gemma/Mistral AI) **or** a Groq API key

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/SIDDXIAO/Fasal-AI-Protector.git
cd Fasal-AI-Protector
```

**2. Create and activate a virtual environment**

```bash
python -m venv venv

# On Linux / macOS
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

**3. Install all dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
SECRET_KEY=your-django-secret-key

DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL Database
DB_NAME=fasal_ai
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# AI Provider: 'gemma' or 'mistral'
AI_PROVIDER=gemma
GEMMA_AI_BASE_URL=http://localhost:1234
GEMMA_AI_MODEL=gemma-2-9b-it

# External API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
MANDI_API_KEY=your_mandi_api_key
```

**5. Set up the database**

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

**6. Set up the AI Server (LM Studio)**

1. Download [LM Studio](https://lmstudio.ai/)
2. Load `gemma-2-9b-it` or `mistral-7b` model
3. Start the Local Inference Server on port `1234`
4. Enable **CORS** in LM Studio settings

**7. Run the development server**

```bash
python manage.py runserver
```

Open your browser at → **http://localhost:8000**

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup/` | Register a new user |
| `POST` | `/api/auth/login/` | Login |
| `POST` | `/api/auth/logout/` | Logout |
| `GET` | `/api/auth/profile/` | Get user profile |

### 🔍 Disease Scanner
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scanner/scan/` | Upload image & detect disease |
| `GET` | `/api/scanner/history/` | View past scan history |
| `GET` | `/api/scanner/search/` | Search crops or insects |

### 🤖 AI Chatbot
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/message/` | Send message to AI assistant |
| `GET` | `/api/chat/history/` | View chat history |

### 🌦️ Weather
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/weather/current/` | Current weather data |
| `GET` | `/api/weather/forecast/` | 7-day forecast |

### 📈 Market (Mandi Rates)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/market/rates/` | Live mandi prices |
| `GET` | `/api/market/crops/` | Available crops list |

---

## 🤖 AI Model Details

| Model | Purpose | Accuracy |
|---|---|---|
| Vision Transformer (ViT) | Plant disease detection | **92%+** |
| Gemma-2 9B / Mistral 7B | RAG-based agricultural chatbot | Groq / LM Studio |

> Training data sourced from the [PlantVillage Dataset](https://plantvillage.psu.edu/) — covers 38+ diseases across multiple crops.

To retrain the ViT model from scratch:

```bash
python vit_training.py
```

---

## 🐛 Troubleshooting

**LM Studio not connecting?**
```bash
curl http://localhost:1234/v1/models
# If no response → Start the inference server inside LM Studio
```

**Database migration errors?**
```bash
python manage.py flush
python manage.py migrate
```

**Mandi rates not loading?**
```bash
python mandi_scraper.py
# Also verify MANDI_API_KEY is set correctly in your .env file
```

---

## 🚀 Production Deployment

```bash
# Collect static files
python manage.py collectstatic

# Run with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

**Production checklist:**
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use PostgreSQL in production
- [ ] Set up HTTPS (SSL certificate)
- [ ] Configure Nginx as reverse proxy

---

## 🙏 Credits

* [PlantVillage Dataset](https://plantvillage.psu.edu/) — Disease training data
* [HuggingFace Transformers](https://huggingface.co/) — ViT model architecture
* [LangChain](https://langchain.com/) — RAG pipeline
* [Django](https://djangoproject.com/) — Web framework
* [OpenWeather](https://openweathermap.org/) — Weather API

---

<div align="center">
  <br/>
  <strong>Made with ❤️ for Indian Farmers 🌾</strong>
  <br/>
  <sub>Fasal AI Protector — Protecting crops, empowering farmers.</sub>
</div>
