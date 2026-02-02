const { generateAIResponse } = require('./openaiService');

// 🤖 AGENTIC SALES INTELLIGENCE ENGINE
class SalesIntelligenceService {
    constructor() {
        this.leadScores = new Map();
        this.competitorMentions = new Map();
        this.urgencyIndicators = new Map();
    }

    // 🎯 LEAD SCORING ALGORITHM (AI-Powered)
    async scoreLeadPotential(signal) {
        let score = 0;
        const content = signal.content.toLowerCase();
        const author = signal.author.toLowerCase();

        // 🔥 TINYGRAD SPECIFIC SCORING (Highest Priority)
        if (content.includes('tinygrad')) {
            score += 100; // Immediate high-value lead
            
            if (content.includes('vs') || content.includes('comparison')) {
                score += 50; // Actively comparing frameworks
            }
            
            if (content.includes('performance') || content.includes('benchmark')) {
                score += 40; // Performance-focused (technical buyer)
            }
        }

        // 💰 FINANCIAL PAIN SCORING (Purchase Intent)
        const financialPainTerms = [
            'too expensive', 'can\'t afford', 'budget', 'cost', 'pricing',
            'expensive', 'overpriced', 'broke', 'costly'
        ];
        financialPainTerms.forEach(term => {
            if (content.includes(term)) score += 25;
        });

        // 🚀 ALTERNATIVE SEEKING (High Intent)
        const alternativeTerms = [
            'alternative', 'alternatives', 'instead of', 'replace',
            'switch from', 'better than', 'cheaper than'
        ];
        alternativeTerms.forEach(term => {
            if (content.includes(term)) score += 30;
        });

        // 👔 DECISION MAKER INDICATORS
        const decisionMakerTitles = [
            'cto', 'vp', 'director', 'head of', 'chief', 'manager',
            'lead', 'principal', 'senior', 'architect'
        ];
        decisionMakerTitles.forEach(title => {
            if (author.includes(title) || content.includes(title)) {
                score += 35;
            }
        });

        // 🏢 ENTERPRISE SIGNALS
        const enterpriseTerms = [
            'enterprise', 'production', 'scale', 'deployment',
            'infrastructure', 'team', 'company', 'startup'
        ];
        enterpriseTerms.forEach(term => {
            if (content.includes(term)) score += 20;
        });

        // 📈 ENGAGEMENT MULTIPLIER
        const engagementScore = (signal.score || 0) + (signal.comments_count || 0);
        if (engagementScore > 100) score *= 1.5;
        else if (engagementScore > 50) score *= 1.3;
        else if (engagementScore > 10) score *= 1.1;

        // 🎯 PLATFORM MULTIPLIER
        if (signal.platform === 'LinkedIn') score *= 1.4; // B2B focused
        if (signal.platform === 'Twitter') score *= 1.2; // High engagement
        if (signal.platform === 'HackerNews') score *= 1.3; // Technical audience

        this.leadScores.set(signal.id, Math.round(score));
        return Math.round(score);
    }

    // 🎭 PERSONA IDENTIFICATION
    identifyPersona(signal) {
        const content = signal.content.toLowerCase();
        const author = signal.author.toLowerCase();

        // Technical Personas
        if (content.includes('pytorch') || content.includes('tensorflow') || content.includes('cuda')) {
            if (author.includes('engineer') || author.includes('developer')) {
                return 'ML Engineer';
            }
            if (author.includes('scientist') || content.includes('research')) {
                return 'Data Scientist';
            }
            return 'Technical Individual Contributor';
        }

        // Business Personas
        if (author.includes('cto') || author.includes('vp') || author.includes('director')) {
            return 'Technical Decision Maker';
        }

        if (content.includes('budget') || content.includes('procurement') || content.includes('vendor')) {
            return 'Procurement/Finance';
        }

        if (content.includes('startup') || content.includes('founder')) {
            return 'Startup Founder/Executive';
        }

        return 'Technical Enthusiast';
    }

    // 🚨 URGENCY DETECTION
    detectUrgency(signal) {
        const content = signal.content.toLowerCase();
        
        const urgentTerms = [
            'urgent', 'asap', 'immediately', 'deadline', 'emergency',
            'critical', 'blocker', 'stuck', 'help needed', 'crisis'
        ];

        const timeIndicators = [
            'this week', 'by friday', 'end of month', 'quarter end',
            'launch date', 'go live', 'production ready'
        ];

        let urgencyScore = 0;
        urgentTerms.forEach(term => {
            if (content.includes(term)) urgencyScore += 3;
        });
        
        timeIndicators.forEach(term => {
            if (content.includes(term)) urgencyScore += 2;
        });

        if (urgencyScore >= 5) return 'High';
        if (urgencyScore >= 3) return 'Medium';
        return 'Low';
    }

    // 🏆 COMPETITOR ANALYSIS
    analyzeCompetitorMentions(signal) {
        const content = signal.content.toLowerCase();
        const competitors = {
            'nvidia': 0,
            'amd': 0,
            'intel': 0,
            'google': 0, // TPU
            'amazon': 0, // Inferentia
            'cerebras': 0,
            'graphcore': 0,
            'sambanova': 0
        };

        Object.keys(competitors).forEach(competitor => {
            if (content.includes(competitor)) {
                competitors[competitor]++;
                this.competitorMentions.set(competitor, 
                    (this.competitorMentions.get(competitor) || 0) + 1
                );
            }
        });

        return competitors;
    }

    // 🎯 SALES OPPORTUNITY CLASSIFICATION
    classifyOpportunity(signal, leadScore) {
        if (leadScore >= 150) {
            return {
                type: 'Hot Lead',
                action: 'Immediate Outreach',
                priority: 'Highest',
                timeline: 'Within 24 hours',
                approach: 'Direct technical discussion'
            };
        }

        if (leadScore >= 100) {
            return {
                type: 'Warm Lead',
                action: 'Engage with Value',
                priority: 'High',
                timeline: 'Within 48 hours',
                approach: 'Educational content + soft pitch'
            };
        }

        if (leadScore >= 50) {
            return {
                type: 'Qualified Prospect',
                action: 'Nurture Campaign',
                priority: 'Medium',
                timeline: 'Within 1 week',
                approach: 'Content marketing + follow'
            };
        }

        return {
            type: 'Cold Prospect',
            action: 'Monitor',
            priority: 'Low',
            timeline: 'Monitor for changes',
            approach: 'Add to nurture sequence'
        };
    }

    // 🤖 AI-POWERED OUTREACH STRATEGY
    async generateOutreachStrategy(signal, leadScore, persona) {
        const opportunity = this.classifyOpportunity(signal, leadScore);
        const urgency = this.detectUrgency(signal);
        
        const prompt = `
        Generate a personalized sales outreach strategy for this lead:
        
        Signal: "${signal.content}"
        Author: ${signal.author}
        Platform: ${signal.platform}
        Lead Score: ${leadScore}
        Persona: ${persona}
        Urgency: ${urgency}
        Opportunity Type: ${opportunity.type}
        
        Create a JSON response with:
        1. Subject line for initial outreach
        2. Opening message (2-3 sentences)
        3. Value proposition specific to their pain point
        4. Call to action
        5. Follow-up strategy
        6. Technical talking points
        
        Focus on Tenstorrent's open-source approach and how it solves their specific problem.
        `;

        try {
            const strategy = await generateAIResponse(prompt, signal);
            return {
                ...opportunity,
                aiStrategy: strategy,
                urgency: urgency,
                persona: persona
            };
        } catch (error) {
            console.error('Error generating outreach strategy:', error);
            return opportunity;
        }
    }

    // 📊 SALES ANALYTICS
    getSalesAnalytics() {
        const totalLeads = this.leadScores.size;
        const hotLeads = Array.from(this.leadScores.values()).filter(score => score >= 150).length;
        const warmLeads = Array.from(this.leadScores.values()).filter(score => score >= 100 && score < 150).length;
        
        return {
            totalLeads,
            hotLeads,
            warmLeads,
            conversionRate: totalLeads > 0 ? ((hotLeads + warmLeads) / totalLeads * 100).toFixed(1) : 0,
            topCompetitors: Array.from(this.competitorMentions.entries())
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5),
            averageLeadScore: totalLeads > 0 ? 
                Math.round(Array.from(this.leadScores.values()).reduce((a, b) => a + b, 0) / totalLeads) : 0
        };
    }

    // 🎯 TINYGRAD SPECIFIC MONITORING
    async monitorTinygradMentions(signals) {
        const tinygradSignals = signals.filter(signal => 
            signal.content.toLowerCase().includes('tinygrad')
        );

        const analysis = {
            totalMentions: tinygradSignals.length,
            sentiment: await this.analyzeSentiment(tinygradSignals),
            competitorComparisons: this.findCompetitorComparisons(tinygradSignals),
            technicalDiscussions: this.identifyTechnicalDiscussions(tinygradSignals),
            businessOpportunities: this.identifyBusinessOpportunities(tinygradSignals)
        };

        return analysis;
    }

    async analyzeSentiment(signals) {
        // Simplified sentiment analysis
        let positive = 0, negative = 0, neutral = 0;
        
        signals.forEach(signal => {
            const content = signal.content.toLowerCase();
            
            const positiveTerms = ['great', 'awesome', 'love', 'amazing', 'excellent', 'perfect', 'fast', 'efficient'];
            const negativeTerms = ['slow', 'bad', 'terrible', 'awful', 'hate', 'broken', 'issues', 'problems'];
            
            const posCount = positiveTerms.filter(term => content.includes(term)).length;
            const negCount = negativeTerms.filter(term => content.includes(term)).length;
            
            if (posCount > negCount) positive++;
            else if (negCount > posCount) negative++;
            else neutral++;
        });

        return { positive, negative, neutral };
    }

    findCompetitorComparisons(signals) {
        return signals.filter(signal => 
            signal.content.toLowerCase().includes('vs') || 
            signal.content.toLowerCase().includes('compared to') ||
            signal.content.toLowerCase().includes('better than')
        );
    }

    identifyTechnicalDiscussions(signals) {
        const technicalTerms = ['performance', 'benchmark', 'speed', 'memory', 'optimization', 'api', 'documentation'];
        return signals.filter(signal => 
            technicalTerms.some(term => signal.content.toLowerCase().includes(term))
        );
    }

    identifyBusinessOpportunities(signals) {
        const businessTerms = ['enterprise', 'production', 'scale', 'team', 'company', 'budget', 'cost'];
        return signals.filter(signal => 
            businessTerms.some(term => signal.content.toLowerCase().includes(term))
        );
    }
}

module.exports = new SalesIntelligenceService();


