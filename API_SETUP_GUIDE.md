# API Setup Guide for Tenstorrent AI Lead Detection Platform

This guide will help you set up API access for LinkedIn and Twitter/X to expand your signal detection capabilities.

## 🔧 Required API Keys

### 1. OpenAI API (Required)
- **Purpose**: Generate AI responses and analyze signals
- **Setup**: [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Environment Variable**: `OPENAI_API_KEY`

### 2. LinkedIn API (Optional but Recommended)
- **Purpose**: Detect AI hardware discussions on LinkedIn
- **Setup Process**:

#### Step 1: Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in app details:
   - App name: "Tenstorrent Lead Detection"
   - Company: Your company
   - Privacy policy URL: Your privacy policy
   - App logo: Upload a logo

#### Step 2: Configure Permissions
1. In your app dashboard, go to "Products"
2. Request access to:
   - **Share on LinkedIn** (for basic posting access)
   - **Sign In with LinkedIn** (for authentication)
   - **Marketing Developer Platform** (for advanced features)

#### Step 3: Get API Credentials
1. Go to "Auth" tab in your app
2. Copy your:
   - Client ID
   - Client Secret
3. Add redirect URLs (for OAuth):
   - `http://localhost:3000/auth/linkedin/callback`

#### Step 4: Generate Access Token
```bash
# Use LinkedIn's OAuth 2.0 flow to get access token
# This requires implementing OAuth flow or using LinkedIn's tools
```

### 3. Twitter/X API (Optional but Recommended)
- **Purpose**: Detect AI hardware discussions on Twitter/X
- **Setup Process**:

#### Step 1: Apply for Twitter Developer Account
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Apply for a developer account
3. Create a new project/app

#### Step 2: Get API Keys
1. In your app dashboard, go to "Keys and tokens"
2. Generate and copy:
   - **API Key** (Consumer Key)
   - **API Secret Key** (Consumer Secret)
   - **Bearer Token** (for API v2)
   - **Access Token**
   - **Access Token Secret**

#### Step 3: Configure Permissions
1. Set app permissions to "Read" (minimum required)
2. For advanced features, you may need "Read and Write"

## 🔐 Environment Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Edit `.env` with your API keys:
```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4

# LinkedIn API Configuration (Optional)
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token_here
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here

# Twitter/X API Configuration (Optional)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret_here
```

## 🚀 Testing Your Setup

### Test Search Functionality
1. Start the platform: `npm start`
2. Open [http://localhost:3000](http://localhost:3000)
3. Try searching for "tinygrad" in the search bar
4. You should see relevant signals highlighted

### Test Platform Integration
- **Reddit + HackerNews**: Work without additional setup
- **LinkedIn**: Requires LinkedIn API tokens
- **Twitter**: Requires Twitter API tokens

### Manual Scan Test
1. Click "Manual Scan" button
2. Check console logs for platform-specific results:
   ```
   Reddit scan completed. Found X signals.
   HackerNews scan completed. Found X signals.
   LinkedIn scan completed. Found X signals.
   Twitter scan completed. Found X signals.
   ```

## 🔍 Enhanced Search Features

### Advanced Search Fields
- **Content Search**: Searches titles and post content
- **Author Search**: Find posts by specific users
- **Keywords Search**: Filter by AI/hardware terms
- **Date Range**: Filter by time period

### Search Terms That Work Well
- `tinygrad` - Finds discussions about the TinyGrad framework
- `NVIDIA alternatives` - Finds people looking for GPU alternatives
- `AI hardware budget` - Finds cost-conscious discussions
- `custom AI chips` - Finds hardware development discussions
- `ML infrastructure` - Finds infrastructure-related posts

## 🎯 Platform-Specific Tips

### LinkedIn
- Best for: Enterprise discussions, executive insights
- Rate Limits: 100 requests per hour for basic access
- Content: Professional AI/ML discussions

### Twitter/X
- Best for: Real-time discussions, developer community
- Rate Limits: 300 requests per 15 minutes (varies by endpoint)
- Content: Technical discussions, announcements

### Reddit
- Best for: Technical deep-dives, community problems
- No API key required
- Content: Detailed technical discussions

### HackerNews
- Best for: Industry news, startup discussions
- No API key required
- Content: News and commentary

## 🚨 Troubleshooting

### Common Issues

1. **"LinkedIn access token not found"**
   - Add your LinkedIn API credentials to `.env`
   - Ensure OAuth flow is completed

2. **"Twitter Bearer Token not found"**
   - Add your Twitter API credentials to `.env`
   - Verify your Twitter app has proper permissions

3. **Search not finding "tinygrad"**
   - Check if the keyword is in our TARGET_KEYWORDS list
   - Verify search functionality is working with other terms

4. **Rate Limit Errors**
   - LinkedIn: Wait 1 hour before retrying
   - Twitter: Wait 15 minutes before retrying
   - Consider reducing scan frequency

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=true
```

## 📈 Optimization Tips

1. **Start with Reddit + HackerNews** (no API keys needed)
2. **Add Twitter first** (easier API access than LinkedIn)
3. **Add LinkedIn last** (requires business verification)
4. **Monitor rate limits** in console logs
5. **Adjust scan frequency** based on your API quotas

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all credentials
3. **Rotate API keys** regularly
4. **Monitor API usage** to detect unauthorized access
5. **Use least-privilege permissions** for API access

---

**Need Help?** Check the console logs when running the platform - they'll show you exactly which APIs are working and which need setup!


