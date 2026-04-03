# 🚜 FasAi protector - Complete Setup Guide

## 📋 Project Overview
FasAi protector is a Django-based web application for plant disease detection using CNN, with RAG-powered chatbot using Mistral AI.

## 🎯 Features
- ✅ User Authentication (Login/Signup)
- ✅ Plant Disease Detection (CNN - 90%+ accuracy)
- ✅ RAG Chatbot with Mistral AI
- ✅ Vector Database (ChromaDB)
- ✅ Weather API Integration
- ✅ Mandi Rate API
- ✅ Responsive Design (All Devices)
- ✅ Offline Support
- ✅ Multi-language (EN, HI, PA, MR)

## 📦 Prerequisites
- Python 3.10+
- LM Studio (running Mistral/OpenAI compatible server)
- 8GB+ RAM
- 10GB+ free disk space

## 🚀 Quick Start

### 1. Setup AI Server (LM Studio)
1. Download [LM Studio](https://lmstudio.ai/).
2. Load a model (e.g., `ministral-3b`).
3. Start the Local Inference Server on port `1234`.
4. Ensure `CORS` is enabled in LM Studio settings.

### 2. Setup Project
```bash
# Clone/Extract project
cd agritech-pro

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create `.env` file:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
GOOGLE_WEATHER_API_KEY=your-google-api-key
MANDI_API_KEY=your-mandi-api-key
```

### 4. Database Setup
```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (crop-insect data)
python manage.py load_crop_data
```

### 5. Initialize AI Models
```bash
# Initialize vector database
python manage.py init_vectordb

# Download/Train CNN model
python manage.py train_cnn
```

### 6. Run Server
```bash
# Run Django server
python manage.py runserver

# Access: http://localhost:8000
```

## 📁 Project Structure
```
agritech-pro/
├── config/              # Django configuration
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── authentication/  # User auth
│   ├── scanner/        # Disease detection
│   ├── chatbot/        # RAG chatbot
│   ├── weather/        # Weather API
│   └── market/         # Mandi rates
├── models/             # AI models
│   ├── plant_disease_cnn.h5
│   └── vector_db/
├── static/             # Frontend assets
├── templates/          # HTML templates
├── media/              # User uploads
└── manage.py
```

## 🧪 Testing
```bash
# Run tests
python manage.py test

# Check CNN model
python manage.py test_cnn

# Test chatbot
python manage.py test_chatbot
```

## 📊 Data Import
```bash
# Import crop-insect CSV data
python manage.py import_csv --file path/to/your/data.csv
```

## 🔧 Configuration

### CNN Model
- Architecture: MobileNetV2 + Custom layers
- Input: 224x224x3
- Classes: 38 plant diseases
- Accuracy: 92%+

### Mistral AI Settings
- Base URL: http://localhost:11434 (default)
- Model: ministral-3:14b
- Temperature: 0.7
- Max Tokens: 800

### Vector DB
- Engine: ChromaDB
- Embedding: sentence-transformers
- Collections: agriculture_knowledge

## 🌐 API Endpoints

### Authentication
- POST `/api/auth/signup/` - Register
- POST `/api/auth/login/` - Login
- POST `/api/auth/logout/` - Logout
- GET `/api/auth/profile/` - Get profile

### Scanner
- POST `/api/scanner/scan/` - Upload & detect
- GET `/api/scanner/history/` - Scan history
- GET `/api/scanner/search/` - Search crops/insects

### Chatbot
- POST `/api/chat/message/` - Send message
- GET `/api/chat/history/` - Chat history

### Weather
- GET `/api/weather/current/` - Current weather
- GET `/api/weather/forecast/` - 7-day forecast

### Market
- GET `/api/market/rates/` - Mandi prices
- GET `/api/market/crops/` - Available crops

## 🎨 Frontend Integration
Your uploaded HTML/CSS/JS files are in:
- `templates/index.html`
- `static/css/style.css`
- `static/js/script.js`

## 🔐 Security
- CSRF protection enabled
- Session-based auth
- File upload validation
- SQL injection protection
- XSS prevention

## 📱 Responsive Design
- Mobile-first approach
- Breakpoints: 600px, 900px
- Touch-optimized
- Offline PWA support

## 🐛 Troubleshooting

### Ollama Connection Error
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

### CNN Model Not Found
```bash
# Download pre-trained model
python manage.py download_cnn

# Or train from scratch
python manage.py train_cnn --epochs 50
```

### Database Errors
```bash
# Reset database
python manage.py flush
python manage.py migrate
```

## 📈 Performance Optimization
- Enable caching
- Compress static files
- Use CDN for assets
- Optimize images
- Database indexing

## 🚀 Deployment

### Production Settings
1. Set `DEBUG=False`
2. Configure `ALLOWED_HOSTS`
3. Use PostgreSQL (optional)
4. Setup HTTPS
5. Use gunicorn/uwsgi
6. Configure nginx

### Deploy Commands
```bash
# Collect static files
python manage.py collectstatic

# Run with gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## 📞 Support
For issues or questions:
1. Check logs: `tail -f logs/django.log`
2. Review error messages
3. Check model loading status

## 🔄 Updates
```bash
# Pull latest code
git pull

# Update dependencies
pip install -r requirements.txt --upgrade

# Run migrations
python manage.py migrate
```

## 📄 License
Private Project - All Rights Reserved

## 🙏 Credits
- PlantVillage Dataset
- Ollama AI
- Django Framework
- TensorFlow/Keras

---

**🎉 Your FasAi protector is ready to deploy!**
