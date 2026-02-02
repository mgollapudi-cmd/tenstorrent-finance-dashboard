/**
 * Finance Service - AP Dashboard & Invoice Analytics
 * Processes payment/invoice data for VP of Finance dashboard
 * Includes auto-categorization based on vendor and keyword mapping
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Data file paths
let dataFiles = [];
const DEFAULT_FILE = path.join(__dirname, '..', '2026-01-19 North_America_Payment_List.xlsx');
const MAPPING_FILE = path.join(__dirname, '..', 'SourceData.xlsx');

// Cache
let cachedInvoices = null;
let lastModified = null;
let categoryMappings = null;

// ============================================
// CATEGORY MAPPING SYSTEM
// ============================================

/**
 * Erik's Required Categories
 */
const CATEGORIES = {
    'Temp': 'Temp',
    'Contractor (Ongoing)': 'Contractor (Ongoing)',
    'Contractor (Project)': 'Contractor (Project)',
    'Services - Engineering': 'Services - Engineering',
    'Services - Legal': 'Services - Legal',
    'Services - Finance': 'Services - Finance',
    'Services - HR': 'Services - HR',
    'Services - IT': 'Services - IT',
    'Services - Other': 'Services - Other',
    'Software (Subscription)': 'Software (Subscription)',
    'Hardware': 'Hardware',
    'Inventory': 'Inventory',
    'Facilities': 'Facilities',
    'Other': 'Other',
    'Uncategorized': 'Uncategorized'
};

/**
 * Load category mappings from SourceData.xlsx
 */
function loadCategoryMappings() {
    if (categoryMappings) return categoryMappings;

    categoryMappings = {
        vendorMappings: {},   // Vendor name -> { category, subCategory }
        keywordMappings: []   // { keyword, category, subCategory }
    };

    try {
        if (!fs.existsSync(MAPPING_FILE)) {
            console.log('Mapping file not found, using defaults');
            return initializeDefaultMappings();
        }

        const workbook = XLSX.readFile(MAPPING_FILE);
        const sheet = workbook.Sheets['Mapping Logic'];
        if (!sheet) {
            console.log('Mapping Logic sheet not found');
            return initializeDefaultMappings();
        }

        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Parse vendor mappings (columns A-C)
        // Parse keyword mappings (columns E-G)
        data.slice(1).forEach(row => {
            // Vendor mapping
            if (row[0]) {
                const vendorName = String(row[0]).toLowerCase().trim();
                categoryMappings.vendorMappings[vendorName] = {
                    category: row[1] || 'Other',
                    subCategory: row[2] || ''
                };
            }

            // Keyword mapping
            if (row[4]) {
                categoryMappings.keywordMappings.push({
                    keyword: String(row[4]).toLowerCase().trim(),
                    category: row[5] || 'Other',
                    subCategory: row[6] || ''
                });
            }
        });

        console.log(`Loaded ${Object.keys(categoryMappings.vendorMappings).length} vendor mappings`);
        console.log(`Loaded ${categoryMappings.keywordMappings.length} keyword mappings`);

    } catch (error) {
        console.error('Error loading mappings:', error);
        return initializeDefaultMappings();
    }

    return categoryMappings;
}

/**
 * Initialize default mappings based on common patterns
 */
function initializeDefaultMappings() {
    categoryMappings = {
        vendorMappings: {
            'synopsys': { category: 'Services', subCategory: 'Engineering' },
            'cadence': { category: 'Services', subCategory: 'Engineering' },
            'wilson sonsini': { category: 'Services', subCategory: 'Legal' },
            'aws': { category: 'Software', subCategory: 'Cloud Services' },
            'nvidia': { category: 'Hardware', subCategory: 'IT Hardware' },
            'dell': { category: 'Hardware', subCategory: 'IT Hardware' },
            'supermicro': { category: 'Hardware', subCategory: 'IT Hardware' },
            'the collective': { category: 'Facilities', subCategory: 'Office Furniture' },
            'quanta': { category: 'Hardware', subCategory: 'Manufacturing' },
            'ase test': { category: 'Services', subCategory: 'Engineering' },
            'siemens': { category: 'Software', subCategory: 'Subscription' },
            'shi canada': { category: 'Software', subCategory: 'Subscription' },
            'avnet': { category: 'Hardware', subCategory: 'Components' },
            'digi-key': { category: 'Hardware', subCategory: 'Components' },
            'exxact': { category: 'Hardware', subCategory: 'IT Hardware' },
            'coasia': { category: 'Services', subCategory: 'Engineering' }
        },
        keywordMappings: [
            { keyword: 'legal', category: 'Services', subCategory: 'Legal' },
            { keyword: 'llp', category: 'Services', subCategory: 'Legal' },
            { keyword: 'law', category: 'Services', subCategory: 'Legal' },
            { keyword: 'audit', category: 'Services', subCategory: 'Finance' },
            { keyword: 'tax', category: 'Services', subCategory: 'Finance' },
            { keyword: 'accounting', category: 'Services', subCategory: 'Finance' },
            { keyword: 'recruit', category: 'Services', subCategory: 'HR' },
            { keyword: 'staffing', category: 'Temp', subCategory: '' },
            { keyword: 'temp', category: 'Temp', subCategory: '' },
            { keyword: 'consulting', category: 'Contractor', subCategory: 'Ongoing' },
            { keyword: 'contractor', category: 'Contractor', subCategory: 'Ongoing' },
            { keyword: 'sow', category: 'Contractor', subCategory: 'Project' },
            { keyword: 'project', category: 'Contractor', subCategory: 'Project' },
            { keyword: 'license', category: 'Software', subCategory: 'Subscription' },
            { keyword: 'subscription', category: 'Software', subCategory: 'Subscription' },
            { keyword: 'saas', category: 'Software', subCategory: 'Subscription' },
            { keyword: 'software', category: 'Software', subCategory: 'Subscription' },
            { keyword: 'server', category: 'Hardware', subCategory: 'IT Hardware' },
            { keyword: 'laptop', category: 'Hardware', subCategory: 'IT Hardware' },
            { keyword: 'computer', category: 'Hardware', subCategory: 'IT Hardware' },
            { keyword: 'switch', category: 'Hardware', subCategory: 'IT Hardware' },
            { keyword: 'furniture', category: 'Facilities', subCategory: 'Office Furniture' },
            { keyword: 'office', category: 'Facilities', subCategory: 'Office' },
            { keyword: 'rent', category: 'Facilities', subCategory: 'Rent' },
            { keyword: 'eda', category: 'Services', subCategory: 'Engineering' },
            { keyword: 'engineering', category: 'Services', subCategory: 'Engineering' },
            { keyword: 'design', category: 'Services', subCategory: 'Engineering' }
        ]
    };
    return categoryMappings;
}

/**
 * Auto-categorize an invoice based on vendor name and description
 */
function categorizeInvoice(invoice) {
    const mappings = loadCategoryMappings();
    const vendorName = (invoice.supplierName || '').toLowerCase();
    const description = (invoice.description || '').toLowerCase();

    // First, try exact vendor match
    for (const [vendor, mapping] of Object.entries(mappings.vendorMappings)) {
        if (vendorName.includes(vendor)) {
            return formatCategory(mapping.category, mapping.subCategory);
        }
    }

    // Second, try keyword matching on description
    for (const mapping of mappings.keywordMappings) {
        if (description.includes(mapping.keyword) || vendorName.includes(mapping.keyword)) {
            return formatCategory(mapping.category, mapping.subCategory);
        }
    }

    // Default to Uncategorized
    return 'Uncategorized';
}

/**
 * Format category string based on Erik's requirements
 */
function formatCategory(category, subCategory) {
    const cat = (category || '').toLowerCase();
    const sub = (subCategory || '').toLowerCase();

    if (cat === 'temp' || cat.includes('temp')) return 'Temp';
    if (cat === 'contractor') {
        if (sub.includes('project')) return 'Contractor (Project)';
        return 'Contractor (Ongoing)';
    }
    if (cat === 'services') {
        if (sub.includes('eng') || sub.includes('eda')) return 'Services - Engineering';
        if (sub.includes('legal')) return 'Services - Legal';
        if (sub.includes('finance') || sub.includes('audit') || sub.includes('tax')) return 'Services - Finance';
        if (sub.includes('hr') || sub.includes('recruit')) return 'Services - HR';
        if (sub.includes('it')) return 'Services - IT';
        return 'Services - Other';
    }
    if (cat === 'software') return 'Software (Subscription)';
    if (cat === 'hardware') return 'Hardware';
    if (cat === 'inventory') return 'Inventory';
    if (cat === 'facilities') return 'Facilities';

    return 'Other';
}

// ============================================
// DATA PARSING
// ============================================

/**
 * Parse Excel date formats
 */
function parseExcelDate(dateValue) {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'number') {
        const date = XLSX.SSF.parse_date_code(dateValue);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    if (typeof dateValue === 'string') {
        const parts = dateValue.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return dateValue;
    }
    
    return null;
}

/**
 * Parse a single Excel file
 */
function parseExcelFile(filePath, region = 'North America') {
    try {
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return [];
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        return rawData.map((row, index) => {
            const amount = parseFloat(row['Amount']) || 0;
            const openBalance = parseFloat(row['Open balance']) || 0;
            const pastDue = parseInt(row['Past due']) || 0;

            const invoice = {
                id: `${region}-${index + 1}`,
                entity: row['Entity'] || '',
                region: region,
                date: parseExcelDate(row['Date']),
                transactionType: row['Transaction type'] || '',
                referenceNumber: row['#'] || '',
                supplierName: row['Supplier display name'] || '',
                vendorCode: row['Vendor '] || '',
                description: row['Memo/Description'] || '',
                dueDate: parseExcelDate(row['Due date']),
                pastDueDays: pastDue,
                amount: amount,
                openBalance: openBalance,
                foreignAmount: parseFloat(row['Foreign amount']) || amount,
                foreignOpenBalance: parseFloat(row['Foreign open balance']) || openBalance,
                currency: row['Line currency'] || 'CAD',
                exchangeRate: parseFloat(row['Exchange rate']) || 1,
                invoiceOwner: row['Invoice Owner'] || '',
                validationStatus: row['Validation of Receipt of Benefits\r\n(confirm goods received, confirm services rendered, confirm invoice is accurate, etc)'] || '',
                paymentStatus: row['Payment status'] || '',
                paymentTerms: row['Payment Terms per the Agreement'] || '',
                hasPO: row['PO (Y/N)'] || '',
                agingCategory: row['Ageing'] || '',
                notes: row['Notes'] || '',
                financeComments: row['Finance Comments'] || '',
                // Will be set by categorization
                category: null,
                manualCategory: null
            };

            // Auto-categorize
            invoice.category = categorizeInvoice(invoice);

            return invoice;
        });

    } catch (error) {
        console.error('Error parsing file:', filePath, error);
        return [];
    }
}

/**
 * Load all invoice data from all configured files
 */
function loadAllInvoices() {
    // Check cache
    if (cachedInvoices && lastModified) {
        // For now, return cache
        // TODO: Add proper cache invalidation
        return cachedInvoices;
    }

    let allInvoices = [];

    // If no files configured, use default
    if (dataFiles.length === 0) {
        dataFiles.push({ path: DEFAULT_FILE, region: 'North America' });
    }

    // Parse each file
    for (const fileConfig of dataFiles) {
        const invoices = parseExcelFile(fileConfig.path, fileConfig.region);
        allInvoices = allInvoices.concat(invoices);
    }

    // Re-index with unique IDs
    allInvoices = allInvoices.map((inv, i) => ({
        ...inv,
        id: i + 1
    }));

    cachedInvoices = allInvoices;
    lastModified = Date.now();

    return allInvoices;
}

/**
 * Add a new data file (for global payables)
 */
function addDataFile(filePath, region) {
    // Check if already exists
    const exists = dataFiles.some(f => f.path === filePath);
    if (!exists) {
        dataFiles.push({ path: filePath, region: region });
        cachedInvoices = null; // Clear cache
    }
    return { success: true, totalFiles: dataFiles.length };
}

/**
 * Clear all data files and reset to default
 */
function resetDataFiles() {
    dataFiles = [{ path: DEFAULT_FILE, region: 'North America' }];
    cachedInvoices = null;
    return { success: true };
}

// ============================================
// MANUAL CATEGORY MANAGEMENT
// ============================================

// Store for manual category overrides
let manualCategories = {};
const MANUAL_CATEGORIES_FILE = path.join(__dirname, '..', 'manual-categories.json');

/**
 * Load manual category overrides from file
 */
function loadManualCategories() {
    try {
        if (fs.existsSync(MANUAL_CATEGORIES_FILE)) {
            const data = fs.readFileSync(MANUAL_CATEGORIES_FILE, 'utf8');
            manualCategories = JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading manual categories:', error);
        manualCategories = {};
    }
    return manualCategories;
}

/**
 * Save manual category overrides to file
 */
function saveManualCategories() {
    try {
        fs.writeFileSync(MANUAL_CATEGORIES_FILE, JSON.stringify(manualCategories, null, 2));
    } catch (error) {
        console.error('Error saving manual categories:', error);
    }
}

/**
 * Set category for a specific invoice
 */
function setInvoiceCategory(invoiceId, category) {
    loadManualCategories();
    manualCategories[invoiceId] = category;
    saveManualCategories();
    
    // Update cached invoice
    if (cachedInvoices) {
        const invoice = cachedInvoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            invoice.manualCategory = category;
            invoice.category = category;
        }
    }
    
    return { success: true, invoiceId, category };
}

/**
 * Bulk set categories for multiple invoices
 */
function bulkSetCategories(invoiceCategories) {
    loadManualCategories();
    
    for (const { invoiceId, category } of invoiceCategories) {
        manualCategories[invoiceId] = category;
        
        if (cachedInvoices) {
            const invoice = cachedInvoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                invoice.manualCategory = category;
                invoice.category = category;
            }
        }
    }
    
    saveManualCategories();
    return { success: true, updated: invoiceCategories.length };
}

/**
 * Add a new vendor mapping
 */
function addVendorMapping(vendorName, category, subCategory) {
    loadCategoryMappings();
    categoryMappings.vendorMappings[vendorName.toLowerCase()] = {
        category: category,
        subCategory: subCategory || ''
    };
    
    // Re-categorize affected invoices
    if (cachedInvoices) {
        cachedInvoices.forEach(inv => {
            if (inv.supplierName.toLowerCase().includes(vendorName.toLowerCase()) && !inv.manualCategory) {
                inv.category = formatCategory(category, subCategory);
            }
        });
    }
    
    return { success: true };
}

// ============================================
// ANALYTICS & AGGREGATIONS
// ============================================

/**
 * Get category breakdown
 */
function getCategoryBreakdown(invoices) {
    const breakdown = {};

    invoices.forEach(inv => {
        const category = inv.manualCategory || inv.category || 'Uncategorized';
        
        if (!breakdown[category]) {
            breakdown[category] = {
                category: category,
                count: 0,
                totalAmount: 0,
                openBalance: 0
            };
        }
        
        breakdown[category].count++;
        breakdown[category].totalAmount += Math.abs(inv.amount);
        breakdown[category].openBalance += inv.openBalance > 0 ? inv.openBalance : 0;
    });

    return Object.values(breakdown).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Get region breakdown
 */
function getRegionBreakdown(invoices) {
    const breakdown = {};

    invoices.forEach(inv => {
        const region = inv.region || 'Unknown';
        
        if (!breakdown[region]) {
            breakdown[region] = {
                region: region,
                count: 0,
                totalAmount: 0,
                openBalance: 0
            };
        }
        
        breakdown[region].count++;
        breakdown[region].totalAmount += Math.abs(inv.amount);
        breakdown[region].openBalance += inv.openBalance > 0 ? inv.openBalance : 0;
    });

    return Object.values(breakdown).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calculate AP Aging Buckets
 */
function calculateAgingBuckets(invoices) {
    const buckets = {
        current: { count: 0, amount: 0 },
        days1to30: { count: 0, amount: 0 },
        days31to60: { count: 0, amount: 0 },
        days61to90: { count: 0, amount: 0 },
        over90: { count: 0, amount: 0 }
    };

    const payables = invoices.filter(inv => inv.openBalance > 0);

    payables.forEach(invoice => {
        const pastDue = invoice.pastDueDays || 0;
        const amount = Math.abs(invoice.openBalance);

        if (pastDue <= 0) {
            buckets.current.count++;
            buckets.current.amount += amount;
        } else if (pastDue <= 30) {
            buckets.days1to30.count++;
            buckets.days1to30.amount += amount;
        } else if (pastDue <= 60) {
            buckets.days31to60.count++;
            buckets.days31to60.amount += amount;
        } else if (pastDue <= 90) {
            buckets.days61to90.count++;
            buckets.days61to90.amount += amount;
        } else {
            buckets.over90.count++;
            buckets.over90.amount += amount;
        }
    });

    return buckets;
}

/**
 * Calculate DPO
 */
function calculateDPO(invoices) {
    const payables = invoices.filter(inv => inv.openBalance > 0);
    if (payables.length === 0) return 0;
    const totalPastDue = payables.reduce((sum, inv) => sum + (inv.pastDueDays || 0), 0);
    return Math.round(totalPastDue / payables.length);
}

/**
 * Get Top Vendors
 */
function getTopVendors(invoices, limit = 10) {
    const vendorSpend = {};

    invoices.forEach(invoice => {
        const vendor = invoice.supplierName || 'Unknown';
        const amount = Math.abs(invoice.amount);
        
        if (!vendorSpend[vendor]) {
            vendorSpend[vendor] = {
                name: vendor,
                totalAmount: 0,
                invoiceCount: 0,
                totalDays: 0,
                category: invoice.category || 'Uncategorized'
            };
        }
        
        vendorSpend[vendor].totalAmount += amount;
        vendorSpend[vendor].invoiceCount++;
        vendorSpend[vendor].totalDays += invoice.pastDueDays || 0;
    });

    return Object.values(vendorSpend)
        .map(v => ({
            ...v,
            avgDaysOutstanding: v.invoiceCount > 0 ? Math.round(v.totalDays / v.invoiceCount) : 0
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, limit);
}

/**
 * Calculate Monthly Trends
 */
function calculateMonthlyTrends(invoices) {
    const monthlyData = {};

    invoices.forEach(invoice => {
        if (!invoice.date) return;
        
        const month = invoice.date.substring(0, 7);
        
        if (!monthlyData[month]) {
            monthlyData[month] = {
                month: month,
                totalAmount: 0,
                invoiceCount: 0,
                paidAmount: 0,
                outstandingAmount: 0
            };
        }

        const amount = Math.abs(invoice.amount);
        monthlyData[month].totalAmount += amount;
        monthlyData[month].invoiceCount++;
        
        if (invoice.openBalance === 0 || invoice.openBalance < 0) {
            monthlyData[month].paidAmount += amount;
        } else {
            monthlyData[month].outstandingAmount += Math.abs(invoice.openBalance);
        }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get Currency Breakdown
 */
function getCurrencyBreakdown(invoices) {
    const currencyData = {};

    invoices.forEach(invoice => {
        const currency = invoice.currency || 'CAD';
        
        if (!currencyData[currency]) {
            currencyData[currency] = {
                currency: currency,
                totalAmount: 0,
                invoiceCount: 0,
                openBalance: 0
            };
        }
        
        currencyData[currency].totalAmount += Math.abs(invoice.foreignAmount || invoice.amount);
        currencyData[currency].openBalance += invoice.foreignOpenBalance > 0 ? invoice.foreignOpenBalance : 0;
        currencyData[currency].invoiceCount++;
    });

    return Object.values(currencyData).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Get Invoice Owner Summary
 */
function getInvoiceOwnerSummary(invoices) {
    const ownerData = {};

    invoices.forEach(invoice => {
        const owner = invoice.invoiceOwner || 'Unassigned';
        
        if (!ownerData[owner]) {
            ownerData[owner] = {
                owner: owner,
                totalAmount: 0,
                invoiceCount: 0,
                openBalance: 0,
                totalDays: 0
            };
        }
        
        ownerData[owner].totalAmount += Math.abs(invoice.amount);
        ownerData[owner].invoiceCount++;
        ownerData[owner].openBalance += invoice.openBalance > 0 ? invoice.openBalance : 0;
        ownerData[owner].totalDays += invoice.pastDueDays || 0;
    });

    return Object.values(ownerData)
        .map(o => ({
            ...o,
            avgProcessingDays: o.invoiceCount > 0 ? Math.round(o.totalDays / o.invoiceCount) : 0
        }))
        .sort((a, b) => b.invoiceCount - a.invoiceCount);
}

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Get Complete Dashboard Summary
 */
function getDashboardSummary() {
    loadManualCategories();
    const invoices = loadAllInvoices();
    
    // Apply manual categories
    invoices.forEach(inv => {
        if (manualCategories[inv.id]) {
            inv.category = manualCategories[inv.id];
            inv.manualCategory = manualCategories[inv.id];
        }
    });
    
    if (!invoices || invoices.length === 0) {
        return {
            error: 'No data available',
            lastUpdated: new Date().toISOString()
        };
    }

    const payables = invoices.filter(inv => inv.openBalance > 0);
    const credits = invoices.filter(inv => inv.openBalance < 0);

    const totalOutstandingAP = payables.reduce((sum, inv) => sum + inv.openBalance, 0);
    const totalCredits = credits.reduce((sum, inv) => sum + Math.abs(inv.openBalance), 0);
    const totalInvoices = invoices.length;
    const openInvoices = payables.length;
    const avgInvoiceAmount = totalInvoices > 0 ? 
        invoices.reduce((sum, inv) => sum + Math.abs(inv.amount), 0) / totalInvoices : 0;
    
    const agingBuckets = calculateAgingBuckets(invoices);
    const dpo = calculateDPO(invoices);

    const overdueInvoices = payables.filter(inv => inv.pastDueDays > 0);
    const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.openBalance, 0);

    // Category stats
    const categoryBreakdown = getCategoryBreakdown(invoices);
    const uncategorizedCount = invoices.filter(inv => 
        (inv.category === 'Uncategorized' || !inv.category) && !inv.manualCategory
    ).length;

    return {
        kpis: {
            totalOutstandingAP,
            totalCredits,
            netAP: totalOutstandingAP - totalCredits,
            totalInvoices,
            openInvoices,
            averageInvoiceAmount: avgInvoiceAmount,
            daysPayableOutstanding: dpo,
            overdueInvoiceCount: overdueInvoices.length,
            totalOverdueAmount,
            overduePercentage: openInvoices > 0 ? 
                Math.round((overdueInvoices.length / openInvoices) * 100) : 0,
            uncategorizedCount,
            categorizedPercentage: totalInvoices > 0 ?
                Math.round(((totalInvoices - uncategorizedCount) / totalInvoices) * 100) : 0
        },
        
        aging: agingBuckets,
        topVendors: getTopVendors(invoices, 15),
        monthlyTrends: calculateMonthlyTrends(invoices),
        currencyBreakdown: getCurrencyBreakdown(invoices),
        invoiceOwners: getInvoiceOwnerSummary(invoices),
        categoryBreakdown: categoryBreakdown,
        regionBreakdown: getRegionBreakdown(invoices),
        
        // Available categories for filtering
        availableCategories: Object.keys(CATEGORIES),
        
        // Available regions
        availableRegions: [...new Set(invoices.map(inv => inv.region))],
        
        lastUpdated: new Date().toISOString(),
        dataFiles: dataFiles.map(f => ({ file: path.basename(f.path), region: f.region })),
        recordCount: invoices.length
    };
}

/**
 * Get invoice list with filtering
 */
function getInvoiceList(filters = {}) {
    loadManualCategories();
    let invoices = loadAllInvoices();
    
    // Apply manual categories
    invoices.forEach(inv => {
        if (manualCategories[inv.id]) {
            inv.category = manualCategories[inv.id];
            inv.manualCategory = manualCategories[inv.id];
        }
    });
    
    if (!invoices) return [];

    // Apply filters
    if (filters.vendor) {
        invoices = invoices.filter(inv => 
            inv.supplierName.toLowerCase().includes(filters.vendor.toLowerCase()));
    }
    
    if (filters.category) {
        invoices = invoices.filter(inv => inv.category === filters.category);
    }
    
    if (filters.region) {
        invoices = invoices.filter(inv => inv.region === filters.region);
    }
    
    if (filters.status) {
        invoices = invoices.filter(inv => 
            inv.paymentStatus === filters.status || inv.agingCategory === filters.status);
    }
    
    if (filters.agingBucket) {
        switch (filters.agingBucket) {
            case 'current':
                invoices = invoices.filter(inv => inv.pastDueDays <= 0 && inv.openBalance > 0);
                break;
            case 'days1to30':
                invoices = invoices.filter(inv => inv.pastDueDays > 0 && inv.pastDueDays <= 30);
                break;
            case 'days31to60':
                invoices = invoices.filter(inv => inv.pastDueDays > 30 && inv.pastDueDays <= 60);
                break;
            case 'days61to90':
                invoices = invoices.filter(inv => inv.pastDueDays > 60 && inv.pastDueDays <= 90);
                break;
            case 'over90':
                invoices = invoices.filter(inv => inv.pastDueDays > 90);
                break;
        }
    }
    
    if (filters.minAmount) {
        invoices = invoices.filter(inv => Math.abs(inv.amount) >= filters.minAmount);
    }
    
    if (filters.maxAmount) {
        invoices = invoices.filter(inv => Math.abs(inv.amount) <= filters.maxAmount);
    }

    if (filters.currency) {
        invoices = invoices.filter(inv => inv.currency === filters.currency);
    }

    if (filters.uncategorizedOnly) {
        invoices = invoices.filter(inv => 
            inv.category === 'Uncategorized' || !inv.category);
    }

    // Sort
    if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortDir = filters.sortDir === 'asc' ? 1 : -1;
        
        invoices.sort((a, b) => {
            if (a[sortField] < b[sortField]) return -1 * sortDir;
            if (a[sortField] > b[sortField]) return 1 * sortDir;
            return 0;
        });
    }

    // Pagination
    const total = invoices.length;
    if (filters.limit) {
        const offset = filters.offset || 0;
        invoices = invoices.slice(offset, offset + filters.limit);
    }

    return { invoices, total };
}

/**
 * Get single invoice
 */
function getInvoiceById(id) {
    loadManualCategories();
    const invoices = loadAllInvoices();
    const invoice = invoices.find(inv => inv.id === parseInt(id));
    if (invoice && manualCategories[invoice.id]) {
        invoice.category = manualCategories[invoice.id];
        invoice.manualCategory = manualCategories[invoice.id];
    }
    return invoice;
}

/**
 * Process uploaded file
 */
function processUploadedFile(filePath, region = 'Uploaded') {
    try {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return { success: false, error: 'File contains no data' };
        }

        // Add to data files
        addDataFile(filePath, region);

        return {
            success: true,
            recordCount: data.length,
            sheetNames: workbook.SheetNames,
            columns: Object.keys(data[0]),
            region: region
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get mapping table for display/editing
 */
function getMappingTable() {
    loadCategoryMappings();
    return {
        vendorMappings: Object.entries(categoryMappings.vendorMappings).map(([vendor, mapping]) => ({
            vendor,
            category: mapping.category,
            subCategory: mapping.subCategory
        })),
        keywordMappings: categoryMappings.keywordMappings,
        availableCategories: Object.keys(CATEGORIES)
    };
}

/**
 * Export data for download
 */
function exportToCSV(filters = {}) {
    const { invoices } = getInvoiceList(filters);
    
    const headers = [
        'ID', 'Date', 'Region', 'Vendor', 'Description', 'Category',
        'Due Date', 'Days Past Due', 'Amount', 'Open Balance', 
        'Currency', 'Invoice Owner', 'Payment Status'
    ];
    
    const rows = invoices.map(inv => [
        inv.id,
        inv.date,
        inv.region,
        inv.supplierName,
        `"${(inv.description || '').replace(/"/g, '""')}"`,
        inv.category,
        inv.dueDate,
        inv.pastDueDays,
        inv.amount,
        inv.openBalance,
        inv.currency,
        inv.invoiceOwner,
        inv.paymentStatus
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// Initialize on load
loadManualCategories();
loadCategoryMappings();

module.exports = {
    getDashboardSummary,
    getInvoiceList,
    getInvoiceById,
    processUploadedFile,
    setInvoiceCategory,
    bulkSetCategories,
    addVendorMapping,
    getMappingTable,
    addDataFile,
    resetDataFiles,
    exportToCSV,
    CATEGORIES
};
