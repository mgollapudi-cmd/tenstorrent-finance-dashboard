const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database/database');
const { scanReddit } = require('./services/redditService');
const { scanHackerNews } = require('./services/hackerNewsService');
const { scanLinkedIn } = require('./services/linkedinService');
const { scanTwitter } = require('./services/twitterService');
const { generateAIResponse } = require('./services/openaiService');
const salesIntelligence = require('./services/salesIntelligenceService'); // 🤖 Agentic AI Sales Intelligence
const chatbotService = require('./services/chatbotService'); // 💬 AI Chatbot Service
const webScrapingService = require('./services/webScrapingService'); // 🕷️ Web Scraping Service
const financeService = require('./services/financeService'); // 💰 Finance Dashboard Service
const { saveSignal, saveResponse, getSignals, getResponses } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for Chart.js
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer for file uploads
const multer = require('multer');
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize database
initializeDatabase();

// Schedule automated scanning every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled scan...');
  try {
    await runFullScan();
  } catch (error) {
    console.error('Scheduled scan failed:', error);
  }
});

// Schedule nightly comprehensive scan at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running nightly comprehensive scan...');
  try {
    const results = await runComprehensiveScan();
    console.log(`Nightly scan completed: ${results.totalSignals} signals processed`);
  } catch (error) {
    console.error('Nightly scan failed:', error);
  }
});

// API Routes
app.get('/api/signals', async (req, res) => {
  try {
    const signals = await getSignals();
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

app.get('/api/responses', async (req, res) => {
  try {
    const responses = await getResponses();
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// 🤖 AGENTIC SALES INTELLIGENCE ENDPOINTS

// Get sales analytics
app.get('/api/sales-analytics', async (req, res) => {
    try {
        const analytics = salesIntelligence.getSalesAnalytics();
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching sales analytics:', error);
        res.status(500).json({ error: 'Failed to fetch sales analytics' });
    }
});

// Get lead score for a signal
app.get('/api/lead-score/:signalId', async (req, res) => {
    try {
        const signals = await getSignals();
        const signal = signals.find(s => s.id == req.params.signalId);
        
        if (!signal) {
            return res.status(404).json({ error: 'Signal not found' });
        }

        const leadScore = await salesIntelligence.scoreLeadPotential(signal);
        const persona = salesIntelligence.identifyPersona(signal);
        const urgency = salesIntelligence.detectUrgency(signal);
        const competitors = salesIntelligence.analyzeCompetitorMentions(signal);
        const strategy = await salesIntelligence.generateOutreachStrategy(signal, leadScore, persona);

        res.json({
            signalId: signal.id,
            leadScore,
            persona,
            urgency,
            competitors,
            strategy
        });
    } catch (error) {
        console.error('Error scoring lead:', error);
        res.status(500).json({ error: 'Failed to score lead' });
    }
});

// Tinygrad monitoring endpoint
app.get('/api/tinygrad-analysis', async (req, res) => {
    try {
        const signals = await getSignals();
        const analysis = await salesIntelligence.monitorTinygradMentions(signals);
        res.json(analysis);
    } catch (error) {
        console.error('Error analyzing tinygrad mentions:', error);
        res.status(500).json({ error: 'Failed to analyze tinygrad mentions' });
    }
});

// Bulk lead scoring for all signals
app.post('/api/score-all-leads', async (req, res) => {
    try {
        const signals = await getSignals();
        const scoredLeads = [];

        for (const signal of signals) {
            const leadScore = await salesIntelligence.scoreLeadPotential(signal);
            const persona = salesIntelligence.identifyPersona(signal);
            const urgency = salesIntelligence.detectUrgency(signal);
            
            scoredLeads.push({
                id: signal.id,
                title: signal.title,
                author: signal.author,
                platform: signal.platform,
                leadScore,
                persona,
                urgency,
                content: signal.content.substring(0, 200) + '...'
            });
        }

        // Sort by lead score (highest first)
        scoredLeads.sort((a, b) => b.leadScore - a.leadScore);

        res.json({
            totalLeads: scoredLeads.length,
            hotLeads: scoredLeads.filter(l => l.leadScore >= 150),
            warmLeads: scoredLeads.filter(l => l.leadScore >= 100 && l.leadScore < 150),
            allLeads: scoredLeads
        });
    } catch (error) {
        console.error('Error scoring all leads:', error);
        res.status(500).json({ error: 'Failed to score leads' });
    }
});

// 💬 AI CHATBOT ENDPOINTS

// Process chat message
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await chatbotService.processChatMessage(message.trim(), userId);
        res.json(response);
    } catch (error) {
        console.error('Error processing chat message:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// Get chat history
app.get('/api/chat/history', async (req, res) => {
    try {
        const history = chatbotService.getHistory();
        res.json(history);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Clear chat history
app.delete('/api/chat/history', async (req, res) => {
    try {
        chatbotService.clearHistory();
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

// Web scraping endpoint
app.post('/api/web-scrape', async (req, res) => {
    try {
        const { platforms } = req.body;
        let results = [];

        if (!platforms || platforms.includes('all')) {
            results = await webScrapingService.runComprehensiveScrape();
        } else {
            // Scrape specific platforms
            if (platforms.includes('linkedin')) {
                const linkedinResults = await webScrapingService.scrapeLinkedInPosts();
                results.push(...linkedinResults);
            }
            if (platforms.includes('twitter')) {
                const twitterResults = await webScrapingService.scrapeTwitterPosts();
                results.push(...twitterResults);
            }
            if (platforms.includes('reddit')) {
                const redditResults = await webScrapingService.scrapeRedditPosts();
                results.push(...redditResults);
            }
            if (platforms.includes('hackernews')) {
                const hnResults = await webScrapingService.scrapeHackerNewsPosts();
                results.push(...hnResults);
            }
        }

        // Save all scraped signals
        for (const signal of results) {
            await saveSignal(signal);
        }

        res.json({
            success: true,
            totalSignals: results.length,
            platformBreakdown: results.reduce((acc, signal) => {
                acc[signal.platform] = (acc[signal.platform] || 0) + 1;
                return acc;
            }, {}),
            signals: results
        });
    } catch (error) {
        console.error('Error in web scraping:', error);
        res.status(500).json({ error: 'Failed to scrape platforms' });
    }
});

app.post('/api/scan', async (req, res) => {
  try {
    const results = await runFullScan();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: 'Manual scan failed' });
  }
});

app.post('/api/generate-response', async (req, res) => {
  try {
    const { signalId, signalContent } = req.body;
    const aiResponse = await generateAIResponse(signalContent);
    
    // Handle both old format (string) and new format (object)
    const responseText = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);
    
    const savedResponse = await saveResponse(signalId, responseText);
    
    // Return the enhanced response format
    res.json({
      ...savedResponse,
      response_text: aiResponse // Send the original format to frontend
    });
  } catch (error) {
    console.error('Generate response error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// 💰 FINANCE DASHBOARD API ENDPOINTS

// Get complete dashboard summary
app.get('/api/finance/dashboard', async (req, res) => {
    try {
        const summary = financeService.getDashboardSummary();
        res.json(summary);
    } catch (error) {
        console.error('Error fetching finance dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch finance dashboard data' });
    }
});

// Get invoice list with filtering
app.get('/api/finance/invoices', async (req, res) => {
    try {
        const filters = {
            vendor: req.query.vendor,
            category: req.query.category,
            region: req.query.region,
            status: req.query.status,
            agingBucket: req.query.agingBucket,
            minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : null,
            maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : null,
            currency: req.query.currency,
            uncategorizedOnly: req.query.uncategorizedOnly === 'true',
            sortBy: req.query.sortBy || 'pastDueDays',
            sortDir: req.query.sortDir || 'desc',
            limit: req.query.limit ? parseInt(req.query.limit) : null,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const result = financeService.getInvoiceList(filters);
        res.json({
            invoices: result.invoices,
            total: result.total,
            count: result.invoices.length,
            filters: filters
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Get single invoice details
app.get('/api/finance/invoices/:id', async (req, res) => {
    try {
        const invoice = financeService.getInvoiceById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// Set category for single invoice
app.post('/api/finance/invoices/:id/category', async (req, res) => {
    try {
        const { category } = req.body;
        const result = financeService.setInvoiceCategory(parseInt(req.params.id), category);
        res.json(result);
    } catch (error) {
        console.error('Error setting category:', error);
        res.status(500).json({ error: 'Failed to set category' });
    }
});

// Bulk set categories
app.post('/api/finance/categories/bulk', async (req, res) => {
    try {
        const { invoiceCategories } = req.body;
        const result = financeService.bulkSetCategories(invoiceCategories);
        res.json(result);
    } catch (error) {
        console.error('Error bulk setting categories:', error);
        res.status(500).json({ error: 'Failed to bulk set categories' });
    }
});

// Get mapping table
app.get('/api/finance/mappings', async (req, res) => {
    try {
        const mappings = financeService.getMappingTable();
        res.json(mappings);
    } catch (error) {
        console.error('Error fetching mappings:', error);
        res.status(500).json({ error: 'Failed to fetch mappings' });
    }
});

// Add vendor mapping
app.post('/api/finance/mappings/vendor', async (req, res) => {
    try {
        const { vendor, category, subCategory } = req.body;
        const result = financeService.addVendorMapping(vendor, category, subCategory);
        res.json(result);
    } catch (error) {
        console.error('Error adding vendor mapping:', error);
        res.status(500).json({ error: 'Failed to add vendor mapping' });
    }
});

// Upload new Excel file with region
app.post('/api/finance/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const region = req.body.region || 'Uploaded';
        const result = financeService.processUploadedFile(req.file.path, region);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'File uploaded and processed successfully',
                ...result
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to process uploaded file' });
    }
});

// Export to CSV
app.get('/api/finance/export', async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            region: req.query.region,
            agingBucket: req.query.agingBucket
        };
        const csv = financeService.exportToCSV(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=AP_Report_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting:', error);
        res.status(500).json({ error: 'Failed to export' });
    }
});

// Reset data files
app.post('/api/finance/reset', async (req, res) => {
    try {
        const result = financeService.resetDataFiles();
        res.json(result);
    } catch (error) {
        console.error('Error resetting:', error);
        res.status(500).json({ error: 'Failed to reset' });
    }
});

// Serve the finance dashboard
app.get('/finance', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance.html'));
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function runFullScan() {
  console.log('Starting full scan...');
  
  try {
    // Scan Reddit
    const redditSignals = await scanReddit();
    for (const signal of redditSignals) {
      await saveSignal(signal);
    }
    
    // Scan HackerNews
    const hnSignals = await scanHackerNews();
    for (const signal of hnSignals) {
      await saveSignal(signal);
    }
    
    console.log(`Scan completed. Found ${redditSignals.length + hnSignals.length} signals.`);
    return { reddit: redditSignals.length, hackernews: hnSignals.length };
  } catch (error) {
    console.error('Scan failed:', error);
    throw error;
  }
}

async function runComprehensiveScan() {
  console.log('Starting comprehensive multi-platform scan...');
  
  try {
    // Run all platform scans in parallel for better performance
    const [redditSignals, hnSignals, linkedinSignals, twitterSignals] = await Promise.allSettled([
      scanReddit(),
      scanHackerNews(),
      scanLinkedIn(),
      scanTwitter()
    ]);

    let totalSignals = 0;
    let highPrioritySignals = 0;
    const results = {
      reddit: 0,
      hackernews: 0,
      linkedin: 0,
      twitter: 0
    };

    // Process Reddit signals
    if (redditSignals.status === 'fulfilled') {
      for (const signal of redditSignals.value) {
        await saveSignal(signal);
        totalSignals++;
        if (signal.priority === 'highest' || signal.priority === 'high') {
          highPrioritySignals++;
        }
      }
      results.reddit = redditSignals.value.length;
    } else {
      console.error('Reddit scan failed:', redditSignals.reason);
    }

    // Process HackerNews signals
    if (hnSignals.status === 'fulfilled') {
      for (const signal of hnSignals.value) {
        await saveSignal(signal);
        totalSignals++;
        if (signal.priority === 'highest' || signal.priority === 'high') {
          highPrioritySignals++;
        }
      }
      results.hackernews = hnSignals.value.length;
    } else {
      console.error('HackerNews scan failed:', hnSignals.reason);
    }

    // Process LinkedIn signals
    if (linkedinSignals.status === 'fulfilled') {
      for (const signal of linkedinSignals.value) {
        await saveSignal(signal);
        totalSignals++;
        if (signal.priority === 'highest' || signal.priority === 'high') {
          highPrioritySignals++;
        }
      }
      results.linkedin = linkedinSignals.value.length;
    } else {
      console.error('LinkedIn scan failed:', linkedinSignals.reason);
    }

    // Process Twitter signals
    if (twitterSignals.status === 'fulfilled') {
      for (const signal of twitterSignals.value) {
        await saveSignal(signal);
        totalSignals++;
        if (signal.priority === 'highest' || signal.priority === 'high') {
          highPrioritySignals++;
        }
      }
      results.twitter = twitterSignals.value.length;
    } else {
      console.error('Twitter scan failed:', twitterSignals.reason);
    }

    console.log(`Comprehensive scan completed. Total: ${totalSignals}, High Priority: ${highPrioritySignals}`);
    console.log(`Platform breakdown: Reddit: ${results.reddit}, HackerNews: ${results.hackernews}, LinkedIn: ${results.linkedin}, Twitter: ${results.twitter}`);
    
    return {
      totalSignals,
      highPrioritySignals,
      ...results
    };
  } catch (error) {
    console.error('Comprehensive scan failed:', error);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Tenstorrent AI Lead Detection Platform running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
});
