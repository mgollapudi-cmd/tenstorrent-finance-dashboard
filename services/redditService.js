const axios = require('axios');

// Target subreddits for AI hardware discussions
const TARGET_SUBREDDITS = [
  'MachineLearning',
  'LocalLLaMA', 
  'ArtificialIntelligence',
  'hardware',
  'buildapc'
];

// Keywords that indicate potential leads
const TARGET_KEYWORDS = [
    'NVIDIA', 'GPU', 'CUDA', 'H100', 'A100', 'RTX', 'GTX', 'V100',
    'AI hardware', 'ML training', 'deep learning', 'neural networks',
    'budget constraints', 'expensive', 'cost', 'alternative', 'alternatives',
    'training', 'inference', 'compute', 'performance', 'TPU', 'tensor',
    'machine learning', 'artificial intelligence', 'model training',
    'data center', 'cloud computing', 'HPC', 'high performance computing',
    'tinygrad', 'pytorch', 'tensorflow', 'JAX', 'MLX', 'triton',
    'RISC-V', 'open source', 'hardware acceleration', 'AI chips',
    'inference engine', 'model optimization', 'quantization', 'pruning',
    'edge computing', 'embedded AI', 'custom silicon', 'ASIC', 'FPGA'
];

// Pain point indicators
const PAIN_POINTS = [
  'expensive', 'cost', 'budget', 'price', 'overpriced', 'costly',
  'shortage', 'scalper', 'waitlist', 'backorder', 'out of stock',
  'slow', 'performance', 'bottleneck', 'limitation', 'issues',
  'problem', 'struggling', 'difficult', 'challenge', 'frustrating',
  'can\'t afford', 'too expensive', 'broke', 'tight budget'
];

async function scanReddit() {
  const signals = [];
  
  try {
    for (const subreddit of TARGET_SUBREDDITS) {
      const subredditSignals = await scanSubreddit(subreddit);
      signals.push(...subredditSignals);
    }
    
    console.log(`Reddit scan completed. Found ${signals.length} potential signals.`);
    return signals;
  } catch (error) {
    console.error('Reddit scan failed:', error);
    return [];
  }
}

async function scanSubreddit(subreddit) {
  try {
    // Using Reddit's JSON API (no authentication required for public posts)
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'TenstorrentLeadDetection/1.0'
      }
    });
    
    const posts = response.data.data.children;
    const signals = [];
    
    for (const post of posts) {
      const postData = post.data;
      const signal = analyzePost(postData, subreddit);
      
      if (signal) {
        signals.push(signal);
      }
    }
    
    return signals;
  } catch (error) {
    console.error(`Error scanning subreddit r/${subreddit}:`, error);
    return [];
  }
}

function analyzePost(postData, subreddit) {
  const { title, selftext, score, num_comments, author, url, created_utc } = postData;
  
  // Combine title and content for keyword analysis
  const fullText = `${title} ${selftext}`.toLowerCase();
  
  // Check if post contains target keywords
  const matchedKeywords = TARGET_KEYWORDS.filter(keyword => 
    fullText.includes(keyword.toLowerCase())
  );
  
  if (matchedKeywords.length === 0) {
    return null;
  }
  
  // Check for pain points
  const painPoints = PAIN_POINTS.filter(pain => 
    fullText.includes(pain.toLowerCase())
  );
  
  // Calculate priority based on engagement and pain points
  let priority = 'medium';
  if (score > 100 || num_comments > 50 || painPoints.length > 2) {
    priority = 'high';
  }
  if (score > 500 || num_comments > 200 || painPoints.length > 4) {
    priority = 'highest';
  }
  
  // Create signal object
  const signal = {
    platform: 'Reddit',
    title: title,
    content: selftext || title,
    url: `https://reddit.com${url}`,
    author: author,
    score: score,
    comments_count: num_comments,
    priority: priority,
    keywords: matchedKeywords.join(', '),
    subreddit: subreddit,
    created_at: new Date(created_utc * 1000).toISOString()
  };
  
  return signal;
}

module.exports = {
  scanReddit
};
