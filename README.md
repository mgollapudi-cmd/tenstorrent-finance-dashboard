# 🧠 Tenstorrent AI Lead Detection Platform

An intelligent lead detection platform that monitors Reddit and HackerNews for AI hardware discussions, automatically identifies potential sales opportunities, and generates contextual AI responses using OpenAI GPT-4.

## 🚀 Features

### Backend Capabilities
- **Real-time Signal Detection**: Monitors Reddit (r/MachineLearning, r/LocalLLaMA, r/ArtificialIntelligence) and HackerNews for AI hardware discussions
- **Intelligent Keyword Matching**: Targets NVIDIA, GPU, CUDA, H100, A100, AI hardware, ML training, budget constraints, and alternatives
- **Priority Scoring System**: Automatically categorizes signals as Highest (Green), High (Blue), or Medium (Orange) based on engagement and pain point indicators
- **OpenAI GPT-4 Integration**: Generates contextual 1-2 sentence sales responses addressing specific pain points
- **Automated Scanning**: Runs every 15 minutes using node-cron
- **SQLite Database**: Persistent storage for signals and AI responses
- **REST API**: Complete API endpoints for frontend communication

### Frontend Experience
- **Modern Glassmorphism Design**: Beautiful, translucent UI with Tenstorrent branding
- **Side-by-side Layout**: Live signals (60% width) and AI responses (40% width)
- **Real-time Updates**: Live data refresh every 2 minutes
- **Interactive Signal Cards**: Platform icons, priority badges, engagement metrics, and tags
- **AI Response Management**: Copy/edit functionality with one-click generation
- **Advanced Filtering**: Filter by priority level and platform
- **Manual Scan Button**: On-demand signal detection
- **Responsive Design**: Mobile-friendly interface

### AI Response Generation
- **Contextual Responses**: Addresses specific pain points (cost, performance, availability)
- **Tenstorrent Positioning**: Mentions open-source approach and AI hardware solutions
- **Soft Call-to-Actions**: Natural, helpful tone without being overly promotional
- **Fallback System**: Intelligent fallback responses when OpenAI API is unavailable

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **NPM** or **Yarn**
- **OpenAI API Key** (GPT-4 access recommended)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tenstorrent-ai-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Database Configuration
DB_PATH=./database/tenstorrent_leads.db

# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
HN_API_BASE_URL=https://hacker-news.firebaseio.com/v0

# Scanning Configuration
SCAN_INTERVAL_MINUTES=15
MAX_SIGNALS_PER_SCAN=50

# Priority Scoring Thresholds
HIGH_PRIORITY_SCORE_THRESHOLD=100
HIGHEST_PRIORITY_SCORE_THRESHOLD=500
HIGH_PRIORITY_COMMENTS_THRESHOLD=50
HIGHEST_PRIORITY_COMMENTS_THRESHOLD=200

# Rate Limiting
API_RATE_LIMIT_DELAY_MS=100
```

### 4. Database Setup
Initialize the SQLite database:
```bash
npm run setup
```

### 5. Start the Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

### Dashboard Overview
1. **Live Signals Section (Left)**: View real-time AI hardware discussions with priority badges
2. **AI Responses Section (Right)**: Generated responses with copy/edit functionality
3. **Manual Scan**: Click the "Manual Scan" button for immediate signal detection
4. **Filters**: Filter signals by priority (Highest/High/Medium) and platform (Reddit/HackerNews)

### Signal Detection
The platform automatically scans for discussions containing:
- **Hardware Keywords**: NVIDIA, GPU, CUDA, H100, A100, RTX, GTX, V100, TPU, etc.
- **Pain Point Indicators**: expensive, cost, budget, shortage, performance issues, etc.
- **AI/ML Terms**: machine learning, deep learning, neural networks, model training, etc.

### Priority System
- **🟢 Highest Priority**: High engagement (500+ score, 200+ comments) + multiple pain points
- **🔵 High Priority**: Moderate engagement (100+ score, 50+ comments) + pain points
- **🟠 Medium Priority**: Basic keyword matches with lower engagement

### AI Response Generation
1. Click on any signal card to open the detail modal
2. Click "Generate AI Response" to create a contextual response
3. Responses address specific pain points and mention Tenstorrent's solutions
4. Copy responses directly or edit them before use

## 🏗️ Project Structure

```
tenstorrent-ai-platform/
├── database/
│   ├── database.js          # SQLite database operations
│   └── tenstorrent_leads.db # SQLite database file
├── services/
│   ├── redditService.js     # Reddit API integration
│   ├── hackerNewsService.js # HackerNews API integration
│   └── openaiService.js     # OpenAI GPT-4 integration
├── public/
│   ├── index.html          # Main dashboard UI
│   ├── styles.css          # Glassmorphism styling
│   └── script.js           # Frontend JavaScript
├── server.js               # Express server with API routes
├── setup.js                # Database initialization
├── package.json            # Dependencies and scripts
└── env.example            # Environment template
```

## 🔧 API Endpoints

### Signals
- `GET /api/signals` - Retrieve all signals
- `POST /api/scan` - Trigger manual scan

### Responses
- `GET /api/responses` - Retrieve all AI responses
- `POST /api/generate-response` - Generate AI response for a signal

### Example API Usage
```javascript
// Manual scan
const response = await fetch('/api/scan', { method: 'POST' });
const result = await response.json();

// Generate AI response
const response = await fetch('/api/generate-response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    signalId: 123, 
    signalContent: "Looking for alternatives to expensive NVIDIA GPUs..." 
  })
});
```

## 🎨 Design Features

### Glassmorphism UI
- **Translucent backgrounds** with backdrop-filter blur effects
- **Gradient overlays** and subtle borders
- **Modern color palette** with Tenstorrent branding
- **Smooth animations** and hover effects
- **Responsive design** for all screen sizes

### Priority Color System
- **Highest Priority**: Green gradient (#00d4aa to #00b894)
- **High Priority**: Blue gradient (#3498db to #2980b9)
- **Medium Priority**: Orange gradient (#f39c12 to #e67e22)

## 🔄 Automated Operations

### Scheduled Scanning
- **Frequency**: Every 15 minutes (configurable)
- **Sources**: Reddit hot posts + HackerNews top stories
- **Rate Limiting**: Respectful API usage with delays
- **Error Handling**: Graceful failure recovery

### Data Management
- **Signal Deduplication**: Prevents duplicate entries
- **Response Tracking**: Links responses to original signals
- **Automatic Cleanup**: Configurable data retention policies

## 🛡️ Security & Performance

### Security Features
- **Helmet.js**: Security headers and protection
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Sanitized API inputs
- **Environment Variables**: Secure configuration management

### Performance Optimizations
- **Compression**: Gzip response compression
- **Rate Limiting**: API request throttling
- **Database Indexing**: Optimized query performance
- **Caching**: Response caching strategies

## 🧪 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup` - Initialize database

### Adding New Features
1. **New Signal Sources**: Extend services directory
2. **Enhanced AI Prompts**: Modify openaiService.js
3. **UI Components**: Update public directory files
4. **Database Schema**: Modify database.js and run setup

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
npm run setup
```

**OpenAI API Failures**
- Verify API key in `.env`
- Check API quota and billing
- Fallback responses will be used automatically

**Signal Detection Issues**
- Check Reddit/HackerNews API availability
- Verify network connectivity
- Review rate limiting settings

**Frontend Not Loading**
- Ensure port 3000 is available
- Check browser console for errors
- Verify static file serving

### Logs and Debugging
- Server logs display in console during development
- Check browser developer tools for frontend issues
- API responses include error details

## 📊 Monitoring & Analytics

### Built-in Metrics
- **Signal Detection Rate**: Signals found per scan
- **Response Generation**: Success/failure rates
- **API Performance**: Response times and errors
- **User Engagement**: Dashboard usage patterns

### Future Enhancements
- **Analytics Dashboard**: Detailed metrics and charts
- **A/B Testing**: Response effectiveness tracking
- **Integration APIs**: CRM and sales tool connections
- **Advanced Filtering**: Machine learning-based signal scoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the Tenstorrent team
- Check documentation and troubleshooting guides

---

**Built with ❤️ for Tenstorrent AI Lead Generation**