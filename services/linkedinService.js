const axios = require('axios');

// LinkedIn API configuration
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// 🎯 HIGH-VALUE SALES KEYWORDS (Agentic AI Focus)
const TARGET_KEYWORDS = [
    // 🔥 HIGHEST PRIORITY: AI Frameworks & Tools
    'tinygrad', 'pytorch', 'tensorflow', 'JAX', 'MLX', 'triton', 'mojo',
    'huggingface', 'transformers', 'llama', 'mistral', 'claude', 'openai',
    'anthropic', 'stability ai', 'midjourney', 'runway',
    
    // 💰 HARDWARE PAIN POINTS (High Purchase Intent)
    'NVIDIA shortage', 'GPU shortage', 'H100 shortage', 'A100 expensive',
    'CUDA licensing', 'GPU costs', 'hardware budget', 'compute costs',
    'cloud bills', 'AWS costs', 'Azure costs', 'GCP costs',
    'GPU availability', 'supply chain issues', 'procurement delays',
    
    // 🚀 ALTERNATIVE SOLUTIONS (Ready to Buy)
    'alternatives to NVIDIA', 'GPU alternatives', 'NVIDIA competitors',
    'custom silicon', 'ASIC development', 'FPGA solutions',
    'RISC-V processors', 'open source hardware', 'hardware acceleration',
    'AI chips', 'inference acceleration', 'edge computing',
    
    // 👔 DECISION MAKERS (High Authority)
    'CTO', 'VP Engineering', 'Head of AI', 'ML Engineering Manager',
    'Director of Data Science', 'Chief AI Officer', 'AI Infrastructure Lead',
    'MLOps Engineer', 'DevOps Lead', 'Platform Engineering',
    
    // 📈 BUSINESS SIGNALS (Purchase Intent)
    'scaling AI', 'production deployment', 'enterprise AI', 'AI strategy',
    'ML infrastructure', 'model deployment', 'inference optimization',
    'cost optimization', 'performance optimization', 'ROI analysis'
];

// 🚨 HIGH-INTENT PAIN POINTS (Immediate Sales Opportunities)
const PAIN_POINTS = [
    // Financial Pain
    'too expensive', 'over budget', 'cost prohibitive', 'can\'t afford',
    'budget constraints', 'ROI concerns', 'cost analysis', 'price comparison',
    
    // Technical Pain
    'performance issues', 'bottlenecks', 'slow training', 'memory limitations',
    'scaling problems', 'deployment challenges', 'integration issues',
    
    // Supply Chain Pain
    'out of stock', 'long lead times', 'supply shortage', 'procurement delays',
    'vendor issues', 'availability problems', 'waiting list',
    
    // Strategic Pain
    'vendor lock-in', 'dependency concerns', 'flexibility needed',
    'open source preference', 'control requirements', 'customization needs'
];

// 🔍 AGENTIC SEARCH TERMS (Sales Intelligence)
const SEARCH_TERMS = [
    // High-Intent Searches
    'tinygrad vs pytorch performance',
    'NVIDIA alternatives 2024',
    'AI hardware procurement challenges',
    'GPU shortage impact business',
    'open source AI acceleration',
    'custom AI chip development',
    'edge AI deployment costs',
    'ML infrastructure optimization',
    'AI compute budget planning',
    'hardware acceleration ROI',
    
    // Decision Maker Searches
    'CTO AI infrastructure strategy',
    'VP Engineering hardware decisions',
    'AI budget planning 2024',
    'enterprise AI deployment',
    'ML platform evaluation',
    'AI hardware vendor selection'
];

async function scanLinkedIn() {
    console.log('Scanning LinkedIn for AI hardware discussions...');
    
    const signals = [];
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    
    if (!accessToken) {
        console.log('LinkedIn access token not found. Skipping LinkedIn scan.');
        return [];
    }

    try {
        // Search for posts using LinkedIn's search API
        for (const searchTerm of SEARCH_TERMS.slice(0, 3)) { // Limit to avoid rate limits
            try {
                const posts = await searchLinkedInPosts(searchTerm, accessToken);
                
                for (const post of posts) {
                    const signal = await processLinkedInPost(post);
                    if (signal) {
                        signals.push(signal);
                    }
                }
                
                // Rate limiting - wait between requests
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Error searching LinkedIn for "${searchTerm}":`, error.message);
            }
        }
    } catch (error) {
        console.error('LinkedIn scan failed:', error);
    }
    
    console.log(`LinkedIn scan completed. Found ${signals.length} potential signals.`);
    return signals;
}

async function searchLinkedInPosts(query, accessToken) {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
    };

    // Use LinkedIn's UGC Posts API to search for content
    // Note: This is a simplified implementation - LinkedIn's actual search API requires specific permissions
    const response = await axios.get(`${LINKEDIN_API_BASE}/ugcPosts`, {
        headers,
        params: {
            q: 'authors',
            authors: 'List((person:' + await getLinkedInPersonUrn(accessToken) + '))',
            count: 20
        }
    });

    return response.data.elements || [];
}

async function getLinkedInPersonUrn(accessToken) {
    // Get the current user's profile to use as a base for searches
    try {
        const response = await axios.get(`${LINKEDIN_API_BASE}/people/~`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.id;
    } catch (error) {
        console.error('Error getting LinkedIn profile:', error.message);
        return 'unknown';
    }
}

async function processLinkedInPost(post) {
    try {
        const content = extractLinkedInContent(post);
        const author = extractLinkedInAuthor(post);
        
        if (!content) return null;
        
        // Check if content matches our criteria
        const relevanceScore = calculateRelevance(content, TARGET_KEYWORDS, PAIN_POINTS);
        if (relevanceScore < 0.3) return null;
        
        const priority = determinePriority(relevanceScore, post);
        const keywords = extractKeywords(content, TARGET_KEYWORDS);
        
        return {
            platform: 'LinkedIn',
            title: content.substring(0, 100) + '...',
            content: content,
            author: author,
            score: post.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
            comments_count: post.socialDetail?.totalSocialActivityCounts?.numComments || 0,
            url: getLinkedInPostUrl(post),
            priority: priority,
            keywords: keywords.join(', '),
            created_at: new Date(post.created?.time || Date.now()).toISOString()
        };
    } catch (error) {
        console.error('Error processing LinkedIn post:', error);
        return null;
    }
}

function extractLinkedInContent(post) {
    if (post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text) {
        return post.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text;
    }
    if (post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareMediaCategory === 'ARTICLE') {
        const media = post.specificContent['com.linkedin.ugc.ShareContent'].media?.[0];
        if (media?.title?.text) {
            return media.title.text + (media.description?.text ? ' - ' + media.description.text : '');
        }
    }
    return null;
}

function extractLinkedInAuthor(post) {
    if (post.author) {
        // Extract person URN and convert to readable format
        const authorUrn = post.author;
        if (authorUrn.includes('person:')) {
            return authorUrn.split('person:')[1] || 'LinkedIn User';
        }
    }
    return 'LinkedIn User';
}

function getLinkedInPostUrl(post) {
    if (post.id) {
        return `https://www.linkedin.com/feed/update/${post.id}`;
    }
    return 'https://www.linkedin.com/feed/';
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
    
    return Math.min(score, 1.0);
}

function determinePriority(relevanceScore, post) {
    const engagement = (post.socialDetail?.totalSocialActivityCounts?.numLikes || 0) + 
                     (post.socialDetail?.totalSocialActivityCounts?.numComments || 0);
    
    if (relevanceScore > 0.7 || engagement > 50) {
        return 'highest';
    } else if (relevanceScore > 0.5 || engagement > 10) {
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
    scanLinkedIn
};
