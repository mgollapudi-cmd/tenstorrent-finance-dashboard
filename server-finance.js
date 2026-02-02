/**
 * Finance Dashboard Server (Standalone)
 * Simplified server for AP Finance Dashboard - no SQLite dependency
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const financeService = require('./services/financeService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload config
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }
});

// ============================================
// FINANCE DASHBOARD API ENDPOINTS
// ============================================

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

// Redirect root to finance dashboard
app.get('/', (req, res) => {
    res.redirect('/finance');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`💰 Finance Dashboard running on port ${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/finance`);
});
