# ATRIQUET - AI Fashion Recommendation System

![ATRIQUET](https://img.shields.io/badge/AI-Powered-blue) ![Status](https://img.shields.io/badge/Status-Active-success)

## 🌟 Overview

ATRIQUET is an intelligent fashion recommendation system that analyzes users' full-body images and provides personalized outfit suggestions based on their physical characteristics, preferred occasion, and desired style. The system leverages Groq's infrastructure for high-speed inference using a two-stage AI pipeline.

## 🎯 Key Features

- **Body Type Analysis**: Advanced AI analyzes body proportions, shape, and physical characteristics
- **Skin Tone Detection**: Determines skin tone and undertone for personalized color recommendations
- **Smart Recommendations**: 3-5 complete outfit suggestions per request
- **Multi-Occasion Support**: Casual, formal, business, party, wedding, and more
- **Style Matching**: 10+ style preferences including minimalist, streetwear, classic, bohemian
- **Brand Suggestions**: Optional brand recommendations for each outfit item
- **Real-time Processing**: Complete analysis in under 5 seconds
- **Avatar Visualization**: Generates a custom 2D avatar wearing the recommended outfit
- **Stateless Architecture**: Lightweight and easy to deploy without database dependencies

## 🏗️ Technical Architecture

### AI Pipeline

**Primary Model - Llama 4 Scout (via Groq)**: 
   - Model: `meta-llama/llama-4-scout-17b-16e-instruct`
   - **Vision Analysis**: Analyzes body type, proportions, skin tone, physical attributes
   - **Outfit Appropriateness**: Determines if current outfit suits the occasion
   - **Smart Recommendations**: Suggests 3 alternative outfits if current outfit is inappropriate
   - **Fast Processing**: Groq's LPU infrastructure delivers responses in 1-3 seconds
   - **Structured Output**: Provides detailed rationale, styling tips, and specific item recommendations

**Fallback**: OpenRouter API (if Groq unavailable)

### Tech Stack

**Backend:**
- FastAPI (Python)
- Groq API (Llama 4 Scout - multimodal vision model)
- OpenRouter API (fallback)
- Pollinations AI (avatar generation)
- Bing Image Search (clothing product images)
- In-memory caching for performance optimization

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- React Dropzone for image upload
- Axios for API calls

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn
- Groq API Key
- OpenAI API Key (for Avatar generation)

## 🚀 Quick Start

### Option 1: Use Startup Scripts (Windows)

1. **Start Both Services:**
   ```batch
   start-all.bat
   ```

2. **Or start individually:**
   ```batch
   # Backend only
   start-backend.bat
   
   # Frontend only
   start-frontend.bat
   ```

### Option 2: Manual Setup

#### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Environment is already configured in `config/.env` with:
   - Groq API Key ✅
   - Gemini API Key ✅
   - MongoDB URL (default: localhost:27017)

4. Start the backend server:
   ```bash
   python main.py
   ```

   Backend will be available at: `http://localhost:8000`
   API Documentation: `http://localhost:8000/docs`

#### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

## 📖 Usage

1. Open `http://localhost:3000` in your browser
2. Upload a full-body portrait photo (portrait orientation recommended)
3. Select your occasion (casual, formal, party, etc.)
4. Choose your style preference (minimalist, streetwear, etc.)
5. Optionally enable brand recommendations
6. Click "Get My Recommendations"
7. View your personalized outfit suggestions in ~5 seconds

## 🎨 Features in Detail

### Body Type Analysis
- Identifies body shape (rectangle, triangle, inverted triangle, hourglass, oval)
- Analyzes proportions (shoulders, waist, hips, legs)
- Provides flattering silhouette recommendations

### Color Recommendations
- Determines skin tone (fair, light, medium, olive, tan, deep)
- Identifies undertone (warm, cool, neutral)
- Suggests complementary color palette
- Lists colors to avoid

### Outfit Recommendations
Each recommendation includes:
- Complete outfit (top, bottom, shoes, accessories)
- Color palette
- Optional brand suggestions
- Detailed rationale explaining why it works
- Specific styling tips
- Confidence score

## 📁 Project Structure

```
ATRIQUET/
├── backend/
│   ├── api/                 # API routes
│   ├── services/            # Core services (Groq, Gemini, Image Processing)
│   ├── models/              # Pydantic models and schemas
│   ├── utils/               # Utilities (caching, helpers)
│   ├── main.py              # FastAPI application entry point
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── components/          # React components
│   │   ├── layout/          # Header, Footer
│   │   ├── ImageUpload.tsx  # Image upload component
│   │   └── RecommendationResults.tsx
│   ├── pages/               # Next.js pages
│   ├── src/                 # Source files (styles, utils)
│   ├── package.json         # Node dependencies
│   └── next.config.js       # Next.js configuration
├── config/
│   └── .env.example         # Environment variables template
├── start-backend.bat        # Backend startup script
├── start-frontend.bat       # Frontend startup script
├── start-all.bat            # Start both services
└── README.md                # This file
```

## 🔧 Configuration

Environment variables are stored in `config/.env` (see `config/.env.example`):

```env
# API Keys
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Image Processing
MAX_IMAGE_SIZE_MB=10
```

## 🔒 Privacy & Security

- Images are processed in-memory and never stored permanently
- All API communications are encrypted
- User profiles stored securely in MongoDB
- User data only saved if user_id is provided (optional)
- No data is sent to third parties except AI service providers (Groq/Gemini)
- CORS configured for security
- Application works without MongoDB if database is unavailable

## 📊 Performance

- **Image Analysis**: ~2-3 seconds (Llama 3.2 Vision 90B)
- **Recommendation Generation**: ~1-2 seconds (Llama 3.3 70B)
- **Total Processing Time**: Under 5 seconds
- **Caching**: Reduces repeat analysis for same user preferences

## 🛠️ API Endpoints

### Main Endpoints

**Recommendations:**
- `POST /api/analyze` - Full analysis and recommendations
- `POST /api/quick-analyze` - Quick body type and color analysis only

**User Profile (Optional - requires MongoDB):**
- `GET /api/user/{user_id}/profile` - Get user profile
- `GET /api/user/{user_id}/history` - Get recommendation history
- `GET /api/user/{user_id}/stats` - Get user statistics

**Information:**
- `GET /api/occasions` - List available occasions
- `GET /api/styles` - List available styles
- `GET /health` - Health check and service status

Full interactive API documentation available at: `http://localhost:8000/docs`

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
- Change `PORT` in config/.env file

**Import errors:**
- Ensure all dependencies are installed: `pip install -r requirements.txt`

**Groq API errors:**
- System will automatically fall back to Gemini
- Check API key in config/.env

### Frontend Issues

**Module not found:**
- Run `npm install` in frontend directory

**Cannot connect to backend:**
- Ensure backend is running on port 8000
- Check `API_URL` in frontend/.env.local

**Image upload fails:**
- Ensure image is portrait orientation
- Maximum file size: 10MB
- Supported formats: JPG, PNG

## 🚀 Future Enhancements

- [ ] User authentication (JWT tokens)
- [ ] Email/password registration
- [ ] Redis caching for better performance
- [ ] Virtual try-on integration
- [ ] Shopping cart and purchase links
- [ ] Direct links to brand websites
- [ ] Social sharing features
- [ ] Mobile app (React Native)
- [ ] Admin dashboard for analytics
- [ ] AI-powered outfit mixing suggestions
- [ ] Seasonal wardrobe recommendations

## 📝 API Keys

Get your API keys from:
- **Groq**: https://console.groq.com/keys
- **Gemini**: https://aistudio.google.com/apikey

Add them to `config/.env` (see `config/.env.example`).

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For issues, questions, or feature requests, please contact the development team.

---

**Built with ❤️ using Groq AI Infrastructure, Llama Models, and Next.js**
