const axios = require('axios');

// Twitter API v2 configuration
const TWITTER_API_BASE = 'https://api.twitter.com/2';

// 🎯 AGENTIC SALES KEYWORDS (X/Twitter Focus)
const TARGET_KEYWORDS = [
    // 🔥 VIRAL AI TOPICS (High Engagement)
    'tinygrad', 'pytorch', 'tensorflow', 'JAX', 'MLX', 'triton', 'mojo',
    'huggingface', 'transformers', 'llama', 'mistral', 'claude',
    'openai', 'anthropic', 'stability ai', 'midjourney',
    
    // 💸 COST COMPLAINTS (High Purchase Intent)
    'NVIDIA expensive', 'GPU prices', 'H100 cost', 'A100 pricing',
    'CUDA expensive', 'GPU shortage', 'can\'t afford GPU',
    'cloud costs', 'AWS bill', 'compute budget', 'hardware budget',
    
    // 🚀 ALTERNATIVE HUNTING (Ready to Switch)
    'NVIDIA alternative', 'GPU alternative', 'cheaper than NVIDIA',
    'open source AI', 'custom silicon', 'RISC-V', 'FPGA',
    'AI chip startup', 'hardware acceleration', 'edge computing',
    
    // 🎭 DEVELOPER PAIN (Technical Audience)
    'CUDA problems', 'memory issues', 'training slow', 'inference slow',
    'optimization needed', 'performance bottleneck', 'scaling issues',
    'deployment challenges', 'model optimization', 'quantization',
    
    // 🏢 ENTERPRISE SIGNALS (B2B Opportunities)
    'enterprise AI', 'production ML', 'AI infrastructure', 'MLOps',
    'AI strategy', 'CTO', 'VP Engineering', 'Head of AI',
    'startup funding', 'Series A', 'Series B', 'AI investment'
];

// 🚨 VIRAL PAIN POINTS (High Engagement Signals)
const PAIN_POINTS = [
    // Financial Frustration
    'too expensive', 'can\'t afford', 'broke', 'overpriced', 'ripoff',
    'budget blown', 'cost prohibitive', 'pricing insane', 'wallet crying',
    
    // Technical Frustration  
    'not working', 'broken', 'slow as hell', 'terrible performance',
    'memory leak', 'crashes', 'buggy', 'unstable', 'nightmare',
    
    // Supply Issues
    'out of stock', 'sold out', 'waitlist', 'scalpers', 'shortage',
    'unavailable', 'backordered', 'delayed', 'supply chain hell',
    
    // Vendor Frustration
    'vendor lock-in', 'monopoly', 'no choice', 'forced to use',
    'proprietary trap', 'closed source', 'license hell', 'support sucks'
];

// 🔍 HIGH-INTENT SEARCH QUERIES (Agentic Monitoring)
const SEARCH_QUERIES = [
    // Direct Competitor Mentions
    'tinygrad vs pytorch',
    'tinygrad performance',
    'tinygrad benchmark',
    'why use tinygrad',
    
    // Pain Point Searches
    'NVIDIA too expensive',
    'GPU alternatives 2024',
    'cheap AI hardware',
    'open source GPU',
    'custom AI chips',
    
    // Technical Searches
    'AI inference optimization',
    'model deployment costs',
    'edge AI hardware',
    'quantization tools',
    'ML acceleration',
    
    // Business Searches  
    'AI infrastructure costs',
    'enterprise AI hardware',
    'AI startup hardware',
    'ML ops platform',
    'AI compute ROI'
];

async function scanTwitter() {
    console.log('Scanning Twitter/X for AI hardware discussions...');
    
    const signals = [];
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
        console.log('Twitter Bearer Token not found. Skipping Twitter scan.');
        return [];
    }

    try {
        // Search for tweets using Twitter API v2
        for (const query of SEARCH_QUERIES.slice(0, 4)) { // Limit to avoid rate limits
            try {
                const tweets = await searchTweets(query, bearerToken);
                
                for (const tweet of tweets) {
                    const signal = await processTwitterPost(tweet);
                    if (signal) {
                        signals.push(signal);
                    }
                }
                
                // Rate limiting - Twitter has strict limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error searching Twitter for "${query}":`, error.message);
            }
        }
    } catch (error) {
        console.error('Twitter scan failed:', error);
    }
    
    console.log(`Twitter scan completed. Found ${signals.length} potential signals.`);
    return signals;
}

async function searchTweets(query, bearerToken) {
    const headers = {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
    };

    const params = {
        'query': `${query} -is:retweet lang:en`,
        'max_results': 20,
        'tweet.fields': 'created_at,author_id,public_metrics,context_annotations',
        'user.fields': 'username,name,verified',
        'expansions': 'author_id'
    };

    const response = await axios.get(`${TWITTER_API_BASE}/tweets/search/recent`, {
        headers,
        params
    });

    const tweets = response.data.data || [];
    const users = response.data.includes?.users || [];
    
    // Merge user data with tweets
    return tweets.map(tweet => {
        const author = users.find(user => user.id === tweet.author_id);
        return { ...tweet, author };
    });
}

async function processTwitterPost(tweet) {
    try {
        const content = tweet.text;
        const author = tweet.author?.username || 'TwitterUser';
        
        if (!content) return null;
        
        // Check if content matches our criteria
        const relevanceScore = calculateRelevance(content, TARGET_KEYWORDS, PAIN_POINTS);
        if (relevanceScore < 0.2) return null;
        
        const priority = determinePriority(relevanceScore, tweet);
        const keywords = extractKeywords(content, TARGET_KEYWORDS);
        
        return {
            platform: 'Twitter',
            title: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            content: content,
            author: author,
            score: tweet.public_metrics?.like_count || 0,
            comments_count: tweet.public_metrics?.reply_count || 0,
            url: `https://twitter.com/${author}/status/${tweet.id}`,
            priority: priority,
            keywords: keywords.join(', '),
            created_at: new Date(tweet.created_at).toISOString()
        };
    } catch (error) {
        console.error('Error processing Twitter post:', error);
        return null;
    }
}

function calculateRelevance(content, keywords, painPoints) {
    const contentLower = content.toLowerCase();
    let score = 0;
    
    // Check for target keywords
    keywords.forEach(keyword => {
        if (contentLower.includes(keyword.toLowerCase())) {
            score += 0.1;
        }
    });
    
    // Check for pain points (higher weight)
    painPoints.forEach(painPoint => {
        if (contentLower.includes(painPoint.toLowerCase())) {
            score += 0.2;
        }
    });
    
    // Boost score for tinygrad specifically
    if (contentLower.includes('tinygrad')) {
        score += 0.3;
    }
    
    return Math.min(score, 1.0);
}

function determinePriority(relevanceScore, tweet) {
    const engagement = (tweet.public_metrics?.like_count || 0) + 
                     (tweet.public_metrics?.reply_count || 0) + 
                     (tweet.public_metrics?.retweet_count || 0);
    
    const isVerified = tweet.author?.verified || false;
    
    if (relevanceScore > 0.7 || engagement > 100 || isVerified) {
        return 'highest';
    } else if (relevanceScore > 0.5 || engagement > 20) {
        return 'high';
    } else {
        return 'medium';
    }
}

function extractKeywords(content, keywords) {
    const contentLower = content.toLowerCase();
    return keywords.filter(keyword => 
        contentLower.includes(keyword.toLowerCase())
    ).slice(0, 5);
}

module.exports = {
    scanTwitter
};
