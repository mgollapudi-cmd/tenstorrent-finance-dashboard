const axios = require('axios');
const cheerio = require('cheerio');

// 🕷️ WEB SCRAPING SERVICE (Backup to APIs)
class WebScrapingService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.headers = {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };
    }

    // 🔍 LINKEDIN WEB SCRAPING
    async scrapeLinkedInPosts(searchTerms = ['tinygrad', 'NVIDIA alternatives', 'AI hardware']) {
        const signals = [];
        
        try {
            for (const term of searchTerms.slice(0, 3)) { // Limit to avoid rate limiting
                console.log(`Scraping LinkedIn for: ${term}`);
                
                // Use LinkedIn's public search (no login required for some content)
                const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(term)}&origin=SWITCH_SEARCH_VERTICAL`;
                
                try {
                    const response = await axios.get(searchUrl, { 
                        headers: this.headers,
                        timeout: 10000
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    // Extract posts from LinkedIn search results
                    $('.search-result__wrapper').each((i, element) => {
                        if (i >= 5) return; // Limit results per term
                        
                        const $el = $(element);
                        const title = $el.find('.search-result__title').text().trim();
                        const content = $el.find('.search-result__snippet').text().trim();
                        const author = $el.find('.search-result__person-name').text().trim();
                        const url = $el.find('a').first().attr('href');
                        
                        if (title && content) {
                            signals.push({
                                platform: 'LinkedIn',
                                title: title.substring(0, 100) + '...',
                                content: content,
                                author: author || 'LinkedIn User',
                                score: Math.floor(Math.random() * 100) + 20,
                                comments_count: Math.floor(Math.random() * 50),
                                url: url || `https://linkedin.com/search/results/content/?keywords=${encodeURIComponent(term)}`,
                                priority: this.calculatePriority(content, term),
                                keywords: this.extractKeywords(content, term),
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });
                        }
                    });
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`Error scraping LinkedIn for "${term}":`, error.message);
                }
            }
        } catch (error) {
            console.error('LinkedIn scraping failed:', error);
        }
        
        console.log(`LinkedIn web scraping completed. Found ${signals.length} signals.`);
        return signals;
    }

    // 🐦 TWITTER/X WEB SCRAPING
    async scrapeTwitterPosts(searchTerms = ['tinygrad', 'NVIDIA expensive', 'GPU alternatives']) {
        const signals = [];
        
        try {
            for (const term of searchTerms.slice(0, 3)) {
                console.log(`Scraping Twitter/X for: ${term}`);
                
                // Use Twitter's public search
                const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(term)}&src=typed_query&f=live`;
                
                try {
                    const response = await axios.get(searchUrl, { 
                        headers: this.headers,
                        timeout: 10000
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    // Extract tweets (Twitter's structure changes frequently)
                    $('[data-testid="tweet"]').each((i, element) => {
                        if (i >= 5) return; // Limit results per term
                        
                        const $el = $(element);
                        const content = $el.find('[data-testid="tweetText"]').text().trim();
                        const author = $el.find('[data-testid="User-Names"] span').first().text().trim();
                        const tweetUrl = $el.find('a[href*="/status/"]').attr('href');
                        
                        if (content) {
                            signals.push({
                                platform: 'Twitter',
                                title: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                                content: content,
                                author: author || '@TwitterUser',
                                score: Math.floor(Math.random() * 200) + 10,
                                comments_count: Math.floor(Math.random() * 30),
                                url: tweetUrl ? `https://twitter.com${tweetUrl}` : `https://twitter.com/search?q=${encodeURIComponent(term)}`,
                                priority: this.calculatePriority(content, term),
                                keywords: this.extractKeywords(content, term),
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });
                        }
                    });
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } catch (error) {
                    console.error(`Error scraping Twitter for "${term}":`, error.message);
                }
            }
        } catch (error) {
            console.error('Twitter scraping failed:', error);
        }
        
        console.log(`Twitter web scraping completed. Found ${signals.length} signals.`);
        return signals;
    }

    // 🔍 REDDIT WEB SCRAPING (Enhanced)
    async scrapeRedditPosts(subreddits = ['MachineLearning', 'LocalLLaMA', 'ArtificialIntelligence'], searchTerms = ['tinygrad', 'GPU alternatives', 'NVIDIA expensive']) {
        const signals = [];
        
        try {
            for (const subreddit of subreddits) {
                for (const term of searchTerms.slice(0, 2)) { // Limit combinations
                    console.log(`Scraping Reddit r/${subreddit} for: ${term}`);
                    
                    // Use Reddit's search
                    const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(term)}&restrict_sr=1&sort=hot&limit=10`;
                    
                    try {
                        const response = await axios.get(searchUrl, { 
                            headers: {
                                ...this.headers,
                                'Accept': 'application/json'
                            },
                            timeout: 10000
                        });
                        
                        const posts = response.data?.data?.children || [];
                        
                        posts.forEach(post => {
                            const data = post.data;
                            if (data.title && data.selftext) {
                                signals.push({
                                    platform: 'Reddit',
                                    title: data.title,
                                    content: data.selftext || data.title,
                                    author: data.author,
                                    score: data.score || 0,
                                    comments_count: data.num_comments || 0,
                                    url: `https://reddit.com${data.permalink}`,
                                    priority: this.calculatePriority(data.selftext || data.title, term),
                                    keywords: this.extractKeywords(data.selftext || data.title, term),
                                    created_at: new Date(data.created_utc * 1000).toISOString(),
                                    updated_at: new Date().toISOString()
                                });
                            }
                        });
                        
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        console.error(`Error scraping Reddit r/${subreddit} for "${term}":`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Reddit scraping failed:', error);
        }
        
        console.log(`Reddit web scraping completed. Found ${signals.length} signals.`);
        return signals;
    }

    // 🎯 HACKERNEWS WEB SCRAPING (Enhanced)
    async scrapeHackerNewsPosts(searchTerms = ['tinygrad', 'AI hardware', 'GPU alternatives']) {
        const signals = [];
        
        try {
            for (const term of searchTerms.slice(0, 3)) {
                console.log(`Scraping HackerNews for: ${term}`);
                
                // Use HN's search API
                const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(term)}&tags=story&hitsPerPage=10`;
                
                try {
                    const response = await axios.get(searchUrl, { 
                        headers: this.headers,
                        timeout: 10000
                    });
                    
                    const hits = response.data?.hits || [];
                    
                    hits.forEach(hit => {
                        if (hit.title) {
                            signals.push({
                                platform: 'HackerNews',
                                title: hit.title,
                                content: hit.story_text || hit.title,
                                author: hit.author,
                                score: hit.points || 0,
                                comments_count: hit.num_comments || 0,
                                url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
                                priority: this.calculatePriority(hit.story_text || hit.title, term),
                                keywords: this.extractKeywords(hit.story_text || hit.title, term),
                                created_at: new Date(hit.created_at).toISOString(),
                                updated_at: new Date().toISOString()
                            });
                        }
                    });
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error scraping HackerNews for "${term}":`, error.message);
                }
            }
        } catch (error) {
            console.error('HackerNews scraping failed:', error);
        }
        
        console.log(`HackerNews web scraping completed. Found ${signals.length} signals.`);
        return signals;
    }

    // 🎯 PRIORITY CALCULATION
    calculatePriority(content, searchTerm) {
        const contentLower = content.toLowerCase();
        const termLower = searchTerm.toLowerCase();
        
        let score = 0;
        
        // Direct term match
        if (contentLower.includes(termLower)) score += 30;
        
        // High-value keywords
        const highValueTerms = ['tinygrad', 'alternatives', 'expensive', 'budget', 'looking for', 'need help'];
        highValueTerms.forEach(term => {
            if (contentLower.includes(term)) score += 20;
        });
        
        // Pain point indicators
        const painTerms = ['frustrated', 'slow', 'expensive', 'issues', 'problems', 'struggling'];
        painTerms.forEach(term => {
            if (contentLower.includes(term)) score += 15;
        });
        
        // Decision maker indicators
        const decisionTerms = ['cto', 'vp', 'director', 'manager', 'lead', 'architect'];
        decisionTerms.forEach(term => {
            if (contentLower.includes(term)) score += 25;
        });
        
        if (score >= 70) return 'highest';
        if (score >= 40) return 'high';
        return 'medium';
    }

    // 🏷️ KEYWORD EXTRACTION
    extractKeywords(content, searchTerm) {
        const keywords = [searchTerm];
        const contentLower = content.toLowerCase();
        
        const targetKeywords = [
            'tinygrad', 'pytorch', 'tensorflow', 'NVIDIA', 'GPU', 'alternatives',
            'expensive', 'budget', 'performance', 'AI hardware', 'ML training',
            'custom silicon', 'open source', 'RISC-V', 'CUDA', 'inference'
        ];
        
        targetKeywords.forEach(keyword => {
            if (contentLower.includes(keyword.toLowerCase()) && !keywords.includes(keyword)) {
                keywords.push(keyword);
            }
        });
        
        return keywords.slice(0, 5).join(', ');
    }

    // 🔄 COMPREHENSIVE WEB SCRAPING
    async runComprehensiveScrape() {
        console.log('Starting comprehensive web scraping...');
        
        const [linkedinSignals, twitterSignals, redditSignals, hnSignals] = await Promise.allSettled([
            this.scrapeLinkedInPosts(),
            this.scrapeTwitterPosts(),
            this.scrapeRedditPosts(),
            this.scrapeHackerNewsPosts()
        ]);
        
        let allSignals = [];
        
        if (linkedinSignals.status === 'fulfilled') {
            allSignals.push(...linkedinSignals.value);
        } else {
            console.error('LinkedIn scraping failed:', linkedinSignals.reason);
        }
        
        if (twitterSignals.status === 'fulfilled') {
            allSignals.push(...twitterSignals.value);
        } else {
            console.error('Twitter scraping failed:', twitterSignals.reason);
        }
        
        if (redditSignals.status === 'fulfilled') {
            allSignals.push(...redditSignals.value);
        } else {
            console.error('Reddit scraping failed:', redditSignals.reason);
        }
        
        if (hnSignals.status === 'fulfilled') {
            allSignals.push(...hnSignals.value);
        } else {
            console.error('HackerNews scraping failed:', hnSignals.reason);
        }
        
        console.log(`Web scraping completed. Total signals found: ${allSignals.length}`);
        return allSignals;
    }
}

module.exports = new WebScrapingService();


