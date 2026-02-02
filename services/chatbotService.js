const { generateAIResponse } = require('./openaiService');
const salesIntelligence = require('./salesIntelligenceService');
const webScraping = require('./webScrapingService');
const { scanLinkedIn } = require('./linkedinService');
const { scanTwitter } = require('./twitterService');
const { scanReddit } = require('./redditService');
const { scanHackerNews } = require('./hackerNewsService');
const { getSignals, saveSignal } = require('../database/database');

// 🤖 AI CHATBOT SERVICE
class ChatbotService {
    constructor() {
        this.conversationHistory = [];
        this.intents = {
            // LinkedIn-related intents
            linkedin_signals: ['linkedin', 'linkedin signals', 'linkedin posts', 'linkedin leads', 'show me linkedin'],
            linkedin_search: ['search linkedin', 'find linkedin', 'linkedin mentions'],
            
            // Twitter/X-related intents
            twitter_signals: ['twitter', 'x signals', 'twitter posts', 'twitter mentions', 'show me twitter', 'x posts'],
            twitter_search: ['search twitter', 'find twitter', 'twitter mentions', 'x mentions'],
            
            // Tinygrad-specific
            tinygrad_search: ['tinygrad', 'find tinygrad', 'tinygrad mentions', 'search tinygrad', 'tinygrad signals'],
            tinygrad_analysis: ['tinygrad analysis', 'analyze tinygrad', 'tinygrad sentiment', 'tinygrad trends'],
            
            // Lead scoring and analysis
            score_leads: ['score leads', 'lead scoring', 'ai scoring', 'rank leads', 'prioritize leads'],
            high_priority: ['high priority', 'hot leads', 'urgent leads', 'highest priority', 'important leads'],
            decision_makers: ['decision makers', 'ctos', 'vps', 'directors', 'managers', 'executives'],
            
            // Budget and cost-related
            budget_leads: ['budget', 'cost conscious', 'cheap', 'affordable', 'budget constraints', 'expensive'],
            alternatives: ['alternatives', 'nvidia alternatives', 'gpu alternatives', 'competitors', 'options'],
            
            // General queries
            show_signals: ['show signals', 'all signals', 'recent signals', 'latest signals', 'signals'],
            analytics: ['analytics', 'stats', 'statistics', 'performance', 'metrics'],
            scan_platforms: ['scan', 'search platforms', 'find leads', 'scrape', 'get signals']
        };
    }

    // 🎯 INTENT RECOGNITION
    recognizeIntent(message) {
        const messageLower = message.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(this.intents)) {
            if (keywords.some(keyword => messageLower.includes(keyword))) {
                return intent;
            }
        }
        
        return 'general_query';
    }

    // 🤖 PROCESS CHAT MESSAGE
    async processChatMessage(message, userId = 'user') {
        try {
            console.log(`Processing chat message: "${message}"`);
            
            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });

            const intent = this.recognizeIntent(message);
            console.log(`Recognized intent: ${intent}`);

            let response;
            let actionData = null;

            switch (intent) {
                case 'linkedin_signals':
                case 'linkedin_search':
                    response = await this.handleLinkedInQuery(message);
                    break;
                
                case 'twitter_signals':
                case 'twitter_search':
                    response = await this.handleTwitterQuery(message);
                    break;
                
                case 'tinygrad_search':
                case 'tinygrad_analysis':
                    response = await this.handleTinygradQuery(message);
                    break;
                
                case 'score_leads':
                    response = await this.handleLeadScoring(message);
                    break;
                
                case 'high_priority':
                    response = await this.handleHighPriorityQuery(message);
                    break;
                
                case 'decision_makers':
                    response = await this.handleDecisionMakerQuery(message);
                    break;
                
                case 'budget_leads':
                    response = await this.handleBudgetQuery(message);
                    break;
                
                case 'alternatives':
                    response = await this.handleAlternativesQuery(message);
                    break;
                
                case 'show_signals':
                    response = await this.handleShowSignals(message);
                    break;
                
                case 'analytics':
                    response = await this.handleAnalyticsQuery(message);
                    break;
                
                case 'scan_platforms':
                    response = await this.handleScanPlatforms(message);
                    break;
                
                default:
                    response = await this.handleGeneralQuery(message);
                    break;
            }

            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response.text,
                timestamp: new Date().toISOString(),
                actionData: actionData
            });

            return response;

        } catch (error) {
            console.error('Error processing chat message:', error);
            return {
                text: "I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.",
                type: 'error'
            };
        }
    }

    // 🔍 LINKEDIN QUERY HANDLER
    async handleLinkedInQuery(message) {
        try {
            const signals = await scanLinkedIn();
            
            if (signals.length === 0) {
                // Fallback to web scraping
                const scrapedSignals = await webScraping.scrapeLinkedInPosts();
                
                // Save scraped signals
                for (const signal of scrapedSignals) {
                    await saveSignal(signal);
                }
                
                return {
                    text: `I found ${scrapedSignals.length} LinkedIn signals through web scraping! Here are the highlights:\n\n${this.formatSignalSummary(scrapedSignals)}`,
                    type: 'linkedin_results',
                    data: scrapedSignals
                };
            }

            return {
                text: `I found ${signals.length} LinkedIn signals! Here are the highlights:\n\n${this.formatSignalSummary(signals)}`,
                type: 'linkedin_results',
                data: signals
            };
        } catch (error) {
            return {
                text: "I encountered an issue accessing LinkedIn data. This might be due to API limitations. Would you like me to try alternative search methods?",
                type: 'error'
            };
        }
    }

    // 🐦 TWITTER QUERY HANDLER
    async handleTwitterQuery(message) {
        try {
            const signals = await scanTwitter();
            
            if (signals.length === 0) {
                // Fallback to web scraping
                const scrapedSignals = await webScraping.scrapeTwitterPosts();
                
                // Save scraped signals
                for (const signal of scrapedSignals) {
                    await saveSignal(signal);
                }
                
                return {
                    text: `I found ${scrapedSignals.length} Twitter/X signals through web scraping! Here are the highlights:\n\n${this.formatSignalSummary(scrapedSignals)}`,
                    type: 'twitter_results',
                    data: scrapedSignals
                };
            }

            return {
                text: `I found ${signals.length} Twitter/X signals! Here are the highlights:\n\n${this.formatSignalSummary(signals)}`,
                type: 'twitter_results',
                data: signals
            };
        } catch (error) {
            return {
                text: "I encountered an issue accessing Twitter/X data. This might be due to API limitations. Would you like me to try alternative search methods?",
                type: 'error'
            };
        }
    }

    // 🎯 TINYGRAD QUERY HANDLER
    async handleTinygradQuery(message) {
        try {
            const allSignals = await getSignals();
            const tinygradSignals = allSignals.filter(signal => 
                signal.content.toLowerCase().includes('tinygrad') ||
                signal.title.toLowerCase().includes('tinygrad') ||
                signal.keywords.toLowerCase().includes('tinygrad')
            );

            if (tinygradSignals.length === 0) {
                // Run comprehensive search for tinygrad
                const searchResults = await Promise.allSettled([
                    webScraping.scrapeLinkedInPosts(['tinygrad']),
                    webScraping.scrapeTwitterPosts(['tinygrad']),
                    webScraping.scrapeRedditPosts(['MachineLearning', 'LocalLLaMA'], ['tinygrad']),
                    webScraping.scrapeHackerNewsPosts(['tinygrad'])
                ]);

                let newSignals = [];
                searchResults.forEach(result => {
                    if (result.status === 'fulfilled') {
                        newSignals.push(...result.value);
                    }
                });

                // Save new signals
                for (const signal of newSignals) {
                    await saveSignal(signal);
                }

                return {
                    text: `I searched across all platforms for "tinygrad" and found ${newSignals.length} new mentions! Here's what I discovered:\n\n${this.formatSignalSummary(newSignals)}`,
                    type: 'tinygrad_results',
                    data: newSignals
                };
            }

            const analysis = await salesIntelligence.monitorTinygradMentions(allSignals);
            
            return {
                text: `I found ${tinygradSignals.length} tinygrad mentions! Here's the analysis:\n\n📊 **Sentiment**: ${analysis.sentiment.positive} positive, ${analysis.sentiment.negative} negative, ${analysis.sentiment.neutral} neutral\n🔥 **Technical Discussions**: ${analysis.technicalDiscussions.length} posts\n💼 **Business Opportunities**: ${analysis.businessOpportunities.length} potential leads\n\n${this.formatSignalSummary(tinygradSignals.slice(0, 5))}`,
                type: 'tinygrad_analysis',
                data: { signals: tinygradSignals, analysis }
            };
        } catch (error) {
            return {
                text: "I encountered an issue while searching for tinygrad mentions. Let me try a different approach.",
                type: 'error'
            };
        }
    }

    // 📊 LEAD SCORING HANDLER
    async handleLeadScoring(message) {
        try {
            const allSignals = await getSignals();
            const scoredLeads = [];

            for (const signal of allSignals.slice(0, 20)) { // Limit for performance
                const score = await salesIntelligence.scoreLeadPotential(signal);
                const persona = salesIntelligence.identifyPersona(signal);
                const urgency = salesIntelligence.detectUrgency(signal);
                
                scoredLeads.push({
                    ...signal,
                    leadScore: score,
                    persona: persona,
                    urgency: urgency
                });
            }

            scoredLeads.sort((a, b) => b.leadScore - a.leadScore);
            const hotLeads = scoredLeads.filter(l => l.leadScore >= 150);
            const warmLeads = scoredLeads.filter(l => l.leadScore >= 100 && l.leadScore < 150);

            return {
                text: `✅ Lead scoring complete! Here's what I found:\n\n🔥 **Hot Leads**: ${hotLeads.length} (150+ points)\n🌡️ **Warm Leads**: ${warmLeads.length} (100-149 points)\n\n**Top 5 Hot Leads:**\n${this.formatScoredLeads(hotLeads.slice(0, 5))}`,
                type: 'lead_scoring_results',
                data: { hotLeads, warmLeads, allScored: scoredLeads }
            };
        } catch (error) {
            return {
                text: "I encountered an issue while scoring leads. Please try again.",
                type: 'error'
            };
        }
    }

    // 🎯 HIGH PRIORITY HANDLER
    async handleHighPriorityQuery(message) {
        const allSignals = await getSignals();
        const highPrioritySignals = allSignals.filter(s => s.priority === 'highest' || s.priority === 'high');
        
        return {
            text: `I found ${highPrioritySignals.length} high-priority signals:\n\n${this.formatSignalSummary(highPrioritySignals.slice(0, 5))}`,
            type: 'high_priority_results',
            data: highPrioritySignals
        };
    }

    // 👔 DECISION MAKER HANDLER
    async handleDecisionMakerQuery(message) {
        const allSignals = await getSignals();
        const decisionMakerSignals = allSignals.filter(signal => {
            const content = (signal.content + ' ' + signal.author).toLowerCase();
            return ['cto', 'vp', 'director', 'manager', 'head of', 'chief'].some(title => 
                content.includes(title)
            );
        });
        
        return {
            text: `I found ${decisionMakerSignals.length} signals from potential decision makers:\n\n${this.formatSignalSummary(decisionMakerSignals.slice(0, 5))}`,
            type: 'decision_maker_results',
            data: decisionMakerSignals
        };
    }

    // 💰 BUDGET QUERY HANDLER
    async handleBudgetQuery(message) {
        const allSignals = await getSignals();
        const budgetSignals = allSignals.filter(signal => {
            const content = signal.content.toLowerCase();
            return ['budget', 'expensive', 'cost', 'cheap', 'affordable', 'price'].some(term => 
                content.includes(term)
            );
        });
        
        return {
            text: `I found ${budgetSignals.length} budget-conscious leads:\n\n${this.formatSignalSummary(budgetSignals.slice(0, 5))}`,
            type: 'budget_results',
            data: budgetSignals
        };
    }

    // 🔄 ALTERNATIVES HANDLER
    async handleAlternativesQuery(message) {
        const allSignals = await getSignals();
        const alternativeSignals = allSignals.filter(signal => {
            const content = signal.content.toLowerCase();
            return ['alternative', 'alternatives', 'instead of', 'replace', 'switch from'].some(term => 
                content.includes(term)
            );
        });
        
        return {
            text: `I found ${alternativeSignals.length} people looking for alternatives:\n\n${this.formatSignalSummary(alternativeSignals.slice(0, 5))}`,
            type: 'alternatives_results',
            data: alternativeSignals
        };
    }

    // 📊 SHOW SIGNALS HANDLER
    async handleShowSignals(message) {
        const allSignals = await getSignals();
        const recentSignals = allSignals.slice(0, 10);
        
        return {
            text: `Here are the ${recentSignals.length} most recent signals:\n\n${this.formatSignalSummary(recentSignals)}`,
            type: 'signals_results',
            data: recentSignals
        };
    }

    // 📈 ANALYTICS HANDLER
    async handleAnalyticsQuery(message) {
        const analytics = salesIntelligence.getSalesAnalytics();
        
        return {
            text: `📊 **Sales Analytics Overview:**\n\n🎯 **Total Leads**: ${analytics.totalLeads}\n🔥 **Hot Leads**: ${analytics.hotLeads}\n🌡️ **Warm Leads**: ${analytics.warmLeads}\n📈 **Conversion Rate**: ${analytics.conversionRate}%\n⭐ **Average Lead Score**: ${analytics.averageLeadScore}\n\n**Top Competitors Mentioned:**\n${analytics.topCompetitors.map(([name, count]) => `• ${name}: ${count} mentions`).join('\n')}`,
            type: 'analytics_results',
            data: analytics
        };
    }

    // 🔍 SCAN PLATFORMS HANDLER
    async handleScanPlatforms(message) {
        try {
            const results = await webScraping.runComprehensiveScrape();
            
            // Save all results
            for (const signal of results) {
                await saveSignal(signal);
            }
            
            return {
                text: `🔍 Comprehensive scan complete! I found ${results.length} new signals across all platforms:\n\n${this.formatPlatformBreakdown(results)}\n\n**Top Signals:**\n${this.formatSignalSummary(results.slice(0, 5))}`,
                type: 'scan_results',
                data: results
            };
        } catch (error) {
            return {
                text: "I encountered an issue while scanning platforms. Please try again.",
                type: 'error'
            };
        }
    }

    // ❓ GENERAL QUERY HANDLER
    async handleGeneralQuery(message) {
        try {
            const prompt = `You are an AI Sales Assistant for Tenstorrent, a company that makes open-source AI hardware alternatives to NVIDIA. 
            
            User asked: "${message}"
            
            Provide a helpful response that:
            1. Acknowledges their question
            2. Suggests specific actions I can take (like searching LinkedIn, scoring leads, finding tinygrad mentions)
            3. Keeps it conversational and sales-focused
            4. Mentions Tenstorrent's value proposition when relevant
            
            Keep it concise and actionable.`;
            
            const aiResponse = await generateAIResponse(prompt, { content: message });
            
            return {
                text: aiResponse,
                type: 'general_response'
            };
        } catch (error) {
            return {
                text: "I'm here to help you find leads and analyze signals! Try asking me to:\n\n• 'Show me LinkedIn signals'\n• 'Find tinygrad mentions'\n• 'Score all leads'\n• 'Find decision makers'\n• 'Show budget-conscious leads'\n\nWhat would you like me to help you with?",
                type: 'fallback'
            };
        }
    }

    // 📝 FORMATTING HELPERS
    formatSignalSummary(signals) {
        return signals.slice(0, 5).map((signal, index) => 
            `${index + 1}. **${signal.platform}** - ${signal.author}\n   "${signal.content.substring(0, 100)}..."\n   🎯 Priority: ${signal.priority} | 💬 ${signal.comments_count} comments`
        ).join('\n\n');
    }

    formatScoredLeads(leads) {
        return leads.map((lead, index) => 
            `${index + 1}. **${lead.leadScore} points** - ${lead.author} (${lead.persona})\n   "${lead.content.substring(0, 80)}..."\n   🚨 Urgency: ${lead.urgency}`
        ).join('\n\n');
    }

    formatPlatformBreakdown(signals) {
        const breakdown = signals.reduce((acc, signal) => {
            acc[signal.platform] = (acc[signal.platform] || 0) + 1;
            return acc;
        }, {});
        
        return Object.entries(breakdown)
            .map(([platform, count]) => `• **${platform}**: ${count} signals`)
            .join('\n');
    }

    // 🧹 CLEAR CONVERSATION HISTORY
    clearHistory() {
        this.conversationHistory = [];
    }

    // 📜 GET CONVERSATION HISTORY
    getHistory() {
        return this.conversationHistory;
    }
}

module.exports = new ChatbotService();


