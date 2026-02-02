const axios = require('axios');

const HN_API_BASE = process.env.HN_API_BASE_URL || 'https://hacker-news.firebaseio.com/v0';

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

async function scanHackerNews() {
  try {
    console.log('Scanning HackerNews for AI hardware discussions...');
    
    // Get top stories
    const topStoriesResponse = await axios.get(`${HN_API_BASE}/topstories.json`);
    const topStoryIds = topStoriesResponse.data.slice(0, 50); // Top 50 stories
    
    const signals = [];
    
    // Process stories in parallel (with rate limiting)
    for (let i = 0; i < topStoryIds.length; i += 5) {
      const batch = topStoryIds.slice(i, i + 5);
      const batchPromises = batch.map(id => getStoryDetails(id));
      
      const batchResults = await Promise.all(batchPromises);
      const validSignals = batchResults.filter(signal => signal !== null);
      signals.push(...validSignals);
      
      // Small delay to be respectful to the API
      if (i + 5 < topStoryIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`HackerNews scan completed. Found ${signals.length} potential signals.`);
    return signals;
  } catch (error) {
    console.error('HackerNews scan failed:', error);
    return [];
  }
}

async function getStoryDetails(storyId) {
  try {
    const response = await axios.get(`${HN_API_BASE}/item/${storyId}.json`);
    const story = response.data;
    
    if (!story || story.deleted || story.type !== 'story') {
      return null;
    }
    
    return analyzeStory(story);
  } catch (error) {
    console.error(`Error fetching story ${storyId}:`, error);
    return null;
  }
}

function analyzeStory(story) {
  const { title, text, url, score, descendants, by, time } = story;
  
  // Combine title and text for keyword analysis
  const fullText = `${title} ${text || ''}`.toLowerCase();
  
  // Check if story contains target keywords
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
  if (score > 100 || descendants > 30 || painPoints.length > 2) {
    priority = 'high';
  }
  if (score > 300 || descendants > 100 || painPoints.length > 4) {
    priority = 'highest';
  }
  
  // Create signal object
  const signal = {
    platform: 'HackerNews',
    title: title,
    content: text || title,
    url: url || `https://news.ycombinator.com/item?id=${story.id}`,
    author: by,
    score: score,
    comments_count: descendants || 0,
    priority: priority,
    keywords: matchedKeywords.join(', '),
    created_at: new Date(time * 1000).toISOString()
  };
  
  return signal;
}

module.exports = {
  scanHackerNews
};
