class TenstorrentLeadDetection {
    constructor() {
        this.signals = [];
        this.responses = [];
        this.leads = [];
        this.salesAnalytics = null;
        this.tinygradAnalysis = null;
        this.currentTab = 'signals';
        this.currentFilters = {
            priority: 'all',
            platform: 'all',
            status: 'all',
            search: ''
        };
        this.currentSignal = null;
        
        this.initializeEventListeners();
        this.loadInitialData();
        this.startRealTimeUpdates();
        this.updateLastLogin();
        this.initializeTabs();
    }
    
    initializeEventListeners() {
        // Manual scan button
        document.getElementById('scanBtn').addEventListener('click', () => {
            this.runManualScan();
        });

        // AI Lead Scoring button
        document.getElementById('aiScoreBtn').addEventListener('click', () => {
            this.scoreAllLeads();
        });

        // AI Chatbot button
        document.getElementById('chatbotBtn').addEventListener('click', () => {
            this.openChatbot();
        });
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        // Filter changes
        document.getElementById('priorityFilter').addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('platformFilter').addEventListener('change', (e) => {
            this.currentFilters.platform = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });
        
        // Unified Search functionality
        document.getElementById('unifiedSearchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Quick filters in the search bar
        document.getElementById('quickPlatformFilter').addEventListener('change', (e) => {
            this.currentFilters.platform = e.target.value;
            this.applyFilters();
        });

        document.getElementById('quickPriorityFilter').addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.applyFilters();
        });

        // Clear search button
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            this.clearSearch();
        });

        // Chatbot event listeners
        document.getElementById('closeChatbot').addEventListener('click', () => {
            this.closeChatbot();
        });

        document.getElementById('chatSend').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Modal buttons
        document.getElementById('markContactedBtn').addEventListener('click', () => {
            this.markAsContacted();
        });
        
        document.getElementById('generateResponseBtn').addEventListener('click', () => {
            if (this.currentSignal) {
                this.generateResponse(this.currentSignal.id, this.currentSignal.content);
            }
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }
    
    updateLastLogin() {
        const now = new Date();
        const timeString = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        document.getElementById('lastLogin').textContent = timeString;
    }

    // 💬 CHATBOT METHODS
    openChatbot() {
        document.getElementById('chatbotModal').style.display = 'block';
        document.getElementById('chatInput').focus();
    }

    closeChatbot() {
        document.getElementById('chatbotModal').style.display = 'none';
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Clear input and add user message to chat
        input.value = '';
        this.addChatMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, userId: 'user' })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            const result = await response.json();
            
            // Remove typing indicator and add assistant response
            this.hideTypingIndicator();
            this.addChatMessage(result.text, 'assistant');
            
            // Handle specific response types
            this.handleChatResponse(result);

        } catch (error) {
            console.error('Error sending chat message:', error);
            this.hideTypingIndicator();
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = this.formatChatMessage(message);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatChatMessage(message) {
        // Convert markdown-style formatting to HTML
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    handleChatResponse(response) {
        // Handle different response types
        switch (response.type) {
            case 'linkedin_results':
            case 'twitter_results':
            case 'tinygrad_results':
                if (response.data && response.data.length > 0) {
                    // Refresh signals if new data was found
                    this.loadSignals();
                }
                break;
            
            case 'lead_scoring_results':
                if (response.data) {
                    // Could show a modal with detailed scoring results
                    console.log('Lead scoring results:', response.data);
                }
                break;
            
            case 'scan_results':
                if (response.data) {
                    // Refresh the dashboard with new data
                    this.loadSignals();
                    this.updateDashboardStats();
                }
                break;
        }
    }
    
    async loadInitialData() {
        try {
            await this.loadSignals();
            await this.loadResponses();
            await this.loadSalesIntelligence(); // 🤖 Load agentic AI data
            await this.loadTinygradAnalysis(); // 🎯 Load tinygrad-specific analysis
            this.updateDashboardStats();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }
    
    async loadSignals() {
        try {
            const response = await fetch('/api/signals');
            if (!response.ok) throw new Error('Failed to fetch signals');
            
            this.signals = await response.json();
            // Add status field if not present
            this.signals = this.signals.map(signal => ({
                ...signal,
                status: signal.status || 'new'
            }));
            this.renderSignals();
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error loading signals:', error);
            this.showLoadingError();
        }
    }
    
    async loadResponses() {
        try {
            const response = await fetch('/api/responses');
            if (!response.ok) throw new Error('Failed to fetch responses');
            
            this.responses = await response.json();
        } catch (error) {
            console.error('Error loading responses:', error);
        }
    }

    // 🤖 AGENTIC SALES INTELLIGENCE METHODS
    async loadSalesIntelligence() {
        try {
            const response = await fetch('/api/sales-analytics');
            if (!response.ok) throw new Error('Failed to fetch sales analytics');
            this.salesAnalytics = await response.json();
        } catch (error) {
            console.error('Error loading sales intelligence:', error);
        }
    }

    async loadTinygradAnalysis() {
        try {
            const response = await fetch('/api/tinygrad-analysis');
            if (!response.ok) throw new Error('Failed to fetch tinygrad analysis');
            this.tinygradAnalysis = await response.json();
        } catch (error) {
            console.error('Error loading tinygrad analysis:', error);
        }
    }

    async getLeadScore(signalId) {
        try {
            const response = await fetch(`/api/lead-score/${signalId}`);
            if (!response.ok) throw new Error('Failed to fetch lead score');
            return await response.json();
        } catch (error) {
            console.error('Error getting lead score:', error);
            return null;
        }
    }

    async scoreAllLeads() {
        try {
            const scanBtn = document.getElementById('scanBtn');
            scanBtn.innerHTML = '<span class="btn-icon">🤖</span>AI Scoring...';
            scanBtn.disabled = true;
            
            const response = await fetch('/api/score-all-leads', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to score leads');
            const results = await response.json();
            
            scanBtn.innerHTML = '<span class="btn-icon">🔄</span>Manual Scan';
            scanBtn.disabled = false;
            
            this.showSalesIntelligenceModal(results);
            return results;
        } catch (error) {
            console.error('Error scoring leads:', error);
            const scanBtn = document.getElementById('scanBtn');
            scanBtn.innerHTML = '<span class="btn-icon">🔄</span>Manual Scan';
            scanBtn.disabled = false;
            return null;
        }
    }
    
    async runManualScan() {
        const scanBtn = document.getElementById('scanBtn');
        const originalHTML = scanBtn.innerHTML;
        
        try {
            scanBtn.disabled = true;
            scanBtn.classList.add('loading');
            scanBtn.innerHTML = '<span class="btn-icon">🔄</span> Scanning...';
            
            const response = await fetch('/api/scan', { method: 'POST' });
            if (!response.ok) throw new Error('Scan failed');
            
            const result = await response.json();
            
            // Reload data after scan
            await this.loadSignals();
            await this.loadResponses();
            
            this.showSuccess(`Scan completed! Found ${result.results.reddit + result.results.hackernews} new signals.`);
        } catch (error) {
            console.error('Manual scan failed:', error);
            this.showError('Manual scan failed. Please try again.');
        } finally {
            scanBtn.disabled = false;
            scanBtn.classList.remove('loading');
            scanBtn.innerHTML = originalHTML;
        }
    }
    
    renderSignals() {
        const container = document.getElementById('signalsContainer');
        const filteredSignals = this.getFilteredSignals();
        
        if (filteredSignals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No signals found</h3>
                    <p>Try adjusting your filters or run a manual scan to find new opportunities.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredSignals.map(signal => this.createSignalRow(signal)).join('');
        
        // Add click listeners to signal cards
        container.querySelectorAll('.signal-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.openSignalModal(filteredSignals[index]);
            });
        });
        
        // Add copy and edit functionality to response cards
        this.setupResponseControls();
    }
    
    createSignalRow(signal) {
        const priorityClass = signal.priority || 'medium';
        const platformClass = this.getPlatformClass(signal.platform);
        const responseExists = this.responses.find(r => r.signal_id === signal.id);
        
        // Collect search terms for highlighting
        const searchTerms = [this.currentFilters.search].filter(term => term && term.trim());
        
        // Apply highlighting to content
        const highlightedContent = this.highlightSearchTerms(
            signal.content || signal.title, 
            searchTerms
        );
        const highlightedAuthor = this.highlightSearchTerms(
            signal.author || 'Anonymous', 
            searchTerms
        );
        
        return `
            <div class="signal-row">
                <div class="signal-card glass ${priorityClass}">
                    <div class="signal-header">
                        <div class="signal-source">
                            <div class="platform-icon ${platformClass}"></div>
                            ${signal.platform}${signal.subreddit ? ` • ${signal.subreddit}` : ''}
                        </div>
                        <span class="signal-priority ${priorityClass}">${priorityClass.toUpperCase()}</span>
                    </div>
                    <div class="signal-content">
                        <span class="signal-author">${highlightedAuthor}</span>: "${this.truncateText(highlightedContent, 200)}"
                    </div>
                    <div class="signal-meta">
                        <span class="signal-datetime">${this.formatTimestamp(signal.created_at)}</span>
                        <span>${signal.score || 0} upvotes • ${signal.comments_count || 0} comments</span>
                    </div>
                    <div class="signal-tags">
                        ${this.renderTags(signal.keywords, searchTerms)}
                    </div>
                </div>
                
                <div class="response-card glass">
                    <div class="response-header">
                        <h3 class="response-title">AI Response</h3>
                        <div class="response-controls">
                            <button class="icon-btn copy-btn" title="Copy Response" data-signal-id="${signal.id}">📋</button>
                            <button class="icon-btn edit-btn" title="Edit Response" data-signal-id="${signal.id}">✏️</button>
                        </div>
                    </div>
                    
                    <div class="response-status">
                        <span class="status-dot ${responseExists ? 'ready' : 'generating'}"></span>
                        <span>${responseExists ? 'Ready' : 'Click signal to generate'}</span>
                    </div>

                    <div class="response-target">
                        <strong>Target:</strong> ${signal.author || 'Anonymous'} • ${signal.platform} • ${priorityClass.toUpperCase()} Priority
                    </div>

                    <div class="response-preview" data-signal-id="${signal.id}">
                        ${responseExists ? this.extractResponseText(responseExists.response_text) : 'Click the signal card to generate an AI response for this opportunity.'}
                    </div>
                </div>
            </div>
        `;
    }
    
    setupResponseControls() {
        // Copy functionality
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const signalId = btn.dataset.signalId;
                const responsePreview = document.querySelector(`.response-preview[data-signal-id="${signalId}"]`);
                const responseText = responsePreview.textContent.trim();
                
                if (responseText && !responseText.includes('Click the signal card')) {
                    navigator.clipboard.writeText(responseText).then(() => {
                        btn.style.color = 'var(--success)';
                        btn.textContent = '✓';
                        setTimeout(() => {
                            btn.textContent = '📋';
                            btn.style.color = '';
                        }, 2000);
                    });
                }
            });
        });

        // Edit functionality
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const signalId = btn.dataset.signalId;
                const responsePreview = document.querySelector(`.response-preview[data-signal-id="${signalId}"]`);
                
                if (responsePreview.contentEditable === 'true') {
                    responsePreview.contentEditable = 'false';
                    responsePreview.classList.remove('editable');
                    btn.textContent = '✏️';
                    btn.style.color = '';
                } else {
                    responsePreview.contentEditable = 'true';
                    responsePreview.classList.add('editable');
                    responsePreview.focus();
                    btn.textContent = '💾';
                    btn.style.color = 'var(--secondary)';
                }
            });
        });
    }
    
    extractResponseText(responseData) {
        if (typeof responseData === 'string') {
            return responseData;
        } else if (responseData && typeof responseData === 'object') {
            // Handle new format with analysis, response, context
            try {
                const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
                return parsed.response || parsed.response_text || 'Response generated successfully.';
            } catch (e) {
                return responseData.response || responseData.response_text || 'Response generated successfully.';
            }
        }
        return 'Response generated successfully.';
    }
    
    getFilteredSignals() {
        return this.signals.filter(signal => {
            const priorityMatch = this.currentFilters.priority === 'all' || signal.priority === this.currentFilters.priority;
            const platformMatch = this.currentFilters.platform === 'all' || signal.platform === this.currentFilters.platform;
            const statusMatch = this.currentFilters.status === 'all' || (signal.status || 'new') === this.currentFilters.status;
            
            // Search functionality
            const searchMatch = !this.currentFilters.search || 
                signal.title.toLowerCase().includes(this.currentFilters.search) ||
                signal.content.toLowerCase().includes(this.currentFilters.search) ||
                (signal.keywords && signal.keywords.toLowerCase().includes(this.currentFilters.search)) ||
                (signal.author && signal.author.toLowerCase().includes(this.currentFilters.search));
            
            return priorityMatch && platformMatch && statusMatch && searchMatch;
        });
    }
    
    applyFilters() {
        this.renderSignals();
        this.updateDashboardStats();
    }
    
    openSignalModal(signal) {
        this.currentSignal = signal;
        const modal = document.getElementById('signalModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="signal-detail">
                <div class="signal-overview">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="platform-icon ${this.getPlatformClass(signal.platform)}"></div>
                            <span style="font-weight: 600;">${signal.platform}</span>
                            <span class="signal-priority ${signal.priority}">${signal.priority.toUpperCase()}</span>
                        </div>
                        <span style="color: var(--text-secondary); font-size: 12px;">${this.formatTimestamp(signal.created_at)}</span>
                    </div>
                    
                    <h4 style="color: var(--text-primary); margin-bottom: 12px; font-size: 16px;">${signal.title}</h4>
                    
                    <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 3px solid var(--secondary);">
                        <p style="line-height: 1.5; color: var(--text-primary);">${signal.content}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
                        <div>
                            <strong style="color: var(--text-secondary); font-size: 12px;">Author:</strong><br>
                            <span style="color: var(--secondary);">${signal.author || 'Anonymous'}</span>
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary); font-size: 12px;">Engagement:</strong><br>
                            <span>${signal.score || 0} upvotes, ${signal.comments_count || 0} comments</span>
                        </div>
                        <div>
                            <strong style="color: var(--text-secondary); font-size: 12px;">Priority:</strong><br>
                            <span class="signal-priority ${signal.priority}">${signal.priority.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    ${signal.keywords ? `
                        <div style="margin-bottom: 16px;">
                            <strong style="color: var(--text-secondary); font-size: 12px; display: block; margin-bottom: 8px;">Keywords:</strong>
                            <div class="signal-tags">${this.renderTags(signal.keywords)}</div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <strong style="color: var(--text-secondary); font-size: 12px;">Original Post:</strong><br>
                        <a href="${signal.url}" target="_blank" style="color: var(--accent); text-decoration: none;">View on ${signal.platform} ↗</a>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        const modal = document.getElementById('signalModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    async generateResponse(signalId, signalContent) {
        const generateBtn = document.getElementById('generateResponseBtn');
        const originalHTML = generateBtn.innerHTML;
        
        try {
            generateBtn.disabled = true;
            generateBtn.classList.add('loading');
            generateBtn.innerHTML = '<span class="btn-icon">🤖</span> Generating...';
            
            const response = await fetch('/api/generate-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signalId, signalContent })
            });
            
            if (!response.ok) throw new Error('Failed to generate response');
            
            const result = await response.json();
            
            // Add to responses and refresh
            this.responses.push(result);
            this.renderSignals();
            this.updateDashboardStats();
            
            this.showSuccess('AI response generated successfully!');
            this.closeModal();
        } catch (error) {
            console.error('Failed to generate response:', error);
            this.showError('Failed to generate AI response. Please try again.');
        } finally {
            generateBtn.disabled = false;
            generateBtn.classList.remove('loading');
            generateBtn.innerHTML = originalHTML;
        }
    }
    
    markAsContacted() {
        if (this.currentSignal) {
            this.currentSignal.status = 'contacted';
            this.updateSignalStatus(this.currentSignal.id, 'contacted');
            this.renderSignals();
            this.updateDashboardStats();
            this.showSuccess('Signal marked as contacted!');
            this.closeModal();
        }
    }
    
    updateSignalStatus(signalId, status) {
        const signalIndex = this.signals.findIndex(s => s.id === signalId);
        if (signalIndex !== -1) {
            this.signals[signalIndex].status = status;
        }
    }
    
    updateDashboardStats() {
        const totalSignals = this.signals.length;
        const filteredSignals = this.getFilteredSignals().length;
        const highestPriorityCount = this.signals.filter(s => s.priority === 'highest').length;
        const responsesGenerated = this.responses.length;
        
        document.getElementById('filteredSignals').textContent = filteredSignals;
        document.getElementById('totalSignals').textContent = totalSignals;
        document.getElementById('highestPriorityCount').textContent = highestPriorityCount;
        document.getElementById('responsesGenerated').textContent = responsesGenerated;
    }
    
    exportData() {
        const filteredSignals = this.getFilteredSignals();
        
        if (filteredSignals.length === 0) {
            this.showError('No signals to export. Try adjusting your filters.');
            return;
        }
        
        const csvContent = this.generateCSV(filteredSignals);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tenstorrent-signals-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showSuccess('Signals exported successfully!');
    }
    
    generateCSV(signals) {
        const headers = ['Platform', 'Author', 'Title', 'Content', 'Priority', 'Score', 'Comments', 'Keywords', 'URL', 'Created'];
        const rows = signals.map(signal => [
            signal.platform,
            signal.author || 'Anonymous',
            `"${(signal.title || '').replace(/"/g, '""')}"`,
            `"${(signal.content || '').replace(/"/g, '""')}"`,
            signal.priority,
            signal.score || 0,
            signal.comments_count || 0,
            `"${(signal.keywords || '').replace(/"/g, '""')}"`,
            signal.url,
            new Date(signal.created_at).toLocaleDateString()
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    startRealTimeUpdates() {
        // Refresh data every 2 minutes
        setInterval(() => {
            this.loadSignals();
            this.loadResponses();
        }, 120000);
    }
    
    // Utility methods
    getPlatformClass(platform) {
        switch (platform.toLowerCase()) {
            case 'reddit': return 'reddit';
            case 'hackernews': return 'hackernews';
            case 'twitter': return 'twitter';
            case 'linkedin': return 'linkedin';
            default: return 'reddit';
        }
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    renderTags(keywords, searchTerms = []) {
        if (!keywords) return '';
        return keywords.split(', ').slice(0, 4).map(keyword => {
            const highlightedKeyword = this.highlightSearchTerms(keyword, searchTerms);
            return `<span class="tag">${highlightedKeyword}</span>`;
        }).join('');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 12px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideIn 0.3s ease;
            max-width: 400px;
            background: ${type === 'success' ? 'linear-gradient(135deg, rgba(0, 208, 132, 0.9), rgba(0, 184, 148, 0.9))' : 'linear-gradient(135deg, rgba(255, 71, 87, 0.9), rgba(192, 57, 43, 0.9))'};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Tab Management
    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        this.updateTabCounts();
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        if (tabName === 'leads') {
            this.loadLeadsData();
        } else if (tabName === 'analytics') {
            this.loadAnalyticsData();
        }
    }

    updateTabCounts() {
        document.getElementById('signalsTabCount').textContent = this.signals.length;
        document.getElementById('leadsTabCount').textContent = this.leads.length;
        document.getElementById('analyticsTabCount').textContent = this.responses.length;
    }

    // Clear search functionality
    clearSearch() {
        this.currentFilters.search = '';
        this.currentFilters.platform = 'all';
        this.currentFilters.priority = 'all';
        
        document.getElementById('unifiedSearchInput').value = '';
        document.getElementById('quickPlatformFilter').value = 'all';
        document.getElementById('quickPriorityFilter').value = 'all';
        
        this.applyFilters();
        this.showSuccess('Search cleared');
    }

    // Enhanced Filtering with Unified Search
    getFilteredSignals() {
        return this.signals.filter(signal => {
            // Basic filters
            const priorityMatch = this.currentFilters.priority === 'all' || signal.priority === this.currentFilters.priority;
            const platformMatch = this.currentFilters.platform === 'all' || signal.platform === this.currentFilters.platform;
            const statusMatch = this.currentFilters.status === 'all' || (signal.status || 'new') === this.currentFilters.status;
            
            // Unified search - searches across all fields
            let searchMatch = true;
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                searchMatch = 
                    signal.title.toLowerCase().includes(searchTerm) ||
                    signal.content.toLowerCase().includes(searchTerm) ||
                    (signal.keywords && signal.keywords.toLowerCase().includes(searchTerm)) ||
                    (signal.author && signal.author.toLowerCase().includes(searchTerm)) ||
                    signal.platform.toLowerCase().includes(searchTerm);
            }
            
            return priorityMatch && platformMatch && statusMatch && searchMatch;
        });
    }

    // Text highlighting for search results
    highlightSearchTerms(text, searchTerms) {
        if (!searchTerms || searchTerms.length === 0) return text;
        
        let highlightedText = text;
        searchTerms.forEach(term => {
            if (term.trim()) {
                const regex = new RegExp(`(${term.trim()})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<span class="search-highlight">$1</span>');
            }
        });
        
        return highlightedText;
    }

    // Leads Management
    loadLeadsData() {
        // Convert signals to leads based on status
        this.leads = this.signals
            .filter(signal => signal.status && signal.status !== 'new')
            .map(signal => ({
                id: signal.id,
                name: signal.author || 'Anonymous',
                company: this.extractCompany(signal.content),
                platform: signal.platform,
                priority: signal.priority,
                status: this.mapSignalStatusToLeadStatus(signal.status),
                source: signal.url,
                createdAt: signal.created_at,
                lastContact: signal.updated_at || signal.created_at,
                responseGenerated: this.responses.some(r => r.signal_id === signal.id)
            }));

        this.renderLeadsPipeline();
        this.updateLeadsStats();
        this.updateTabCounts();
    }

    extractCompany(content) {
        // Simple company extraction logic - can be enhanced
        const companies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'NVIDIA', 'OpenAI'];
        for (const company of companies) {
            if (content.toLowerCase().includes(company.toLowerCase())) {
                return company;
            }
        }
        return 'Unknown Company';
    }

    mapSignalStatusToLeadStatus(signalStatus) {
        switch (signalStatus) {
            case 'responded': return 'contacted';
            case 'contacted': return 'discussion';
            default: return 'new';
        }
    }

    renderLeadsPipeline() {
        const stages = ['new', 'contacted', 'discussion', 'qualified'];
        
        stages.forEach(stage => {
            const stageLeads = this.leads.filter(lead => lead.status === stage);
            const columnElement = document.getElementById(`${stage}LeadsColumn`);
            const countElement = document.getElementById(`${stage}LeadsCount`);
            
            countElement.textContent = stageLeads.length;
            
            if (stageLeads.length === 0) {
                columnElement.innerHTML = `<div class="empty-stage">No ${stage} leads</div>`;
            } else {
                columnElement.innerHTML = stageLeads.map(lead => this.createLeadCard(lead)).join('');
            }
        });
    }

    createLeadCard(lead) {
        return `
            <div class="lead-card" data-lead-id="${lead.id}">
                <div class="lead-name">${lead.name}</div>
                <div class="lead-company">${lead.company}</div>
                <div class="lead-meta">
                    <span class="lead-priority ${lead.priority}">${lead.priority.toUpperCase()}</span>
                    <span>${this.formatTimestamp(lead.lastContact)}</span>
                </div>
            </div>
        `;
    }

    updateLeadsStats() {
        const totalLeads = this.leads.length;
        const hotLeads = this.leads.filter(lead => lead.priority === 'highest').length;
        const convertedLeads = this.leads.filter(lead => lead.status === 'qualified').length;
        const responseRate = totalLeads > 0 ? Math.round((this.responses.length / totalLeads) * 100) : 0;

        document.getElementById('totalLeads').textContent = totalLeads;
        document.getElementById('hotLeads').textContent = hotLeads;
        document.getElementById('convertedLeads').textContent = convertedLeads;
        document.getElementById('responseRate').textContent = `${responseRate}%`;
    }

    // Analytics
    loadAnalyticsData() {
        this.renderAnalytics();
    }

    renderAnalytics() {
        // Simple analytics rendering - can be enhanced with actual charts
        this.renderSourceChart();
        this.renderPriorityChart();
        this.renderPerformanceChart();
        this.renderFunnelChart();
    }

    renderSourceChart() {
        const sourceChart = document.getElementById('sourceChart');
        const platforms = {};
        this.signals.forEach(signal => {
            platforms[signal.platform] = (platforms[signal.platform] || 0) + 1;
        });

        const chartData = Object.entries(platforms).map(([platform, count]) => 
            `${platform}: ${count} signals`
        ).join('<br>');

        sourceChart.innerHTML = `
            <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                ${chartData || 'No data available'}
            </div>
        `;
    }

    renderPriorityChart() {
        const priorityChart = document.getElementById('priorityChart');
        const priorities = { highest: 0, high: 0, medium: 0 };
        this.signals.forEach(signal => {
            priorities[signal.priority] = (priorities[signal.priority] || 0) + 1;
        });

        const chartData = Object.entries(priorities).map(([priority, count]) => 
            `${priority.toUpperCase()}: ${count} signals`
        ).join('<br>');

        priorityChart.innerHTML = `
            <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                ${chartData}
            </div>
        `;
    }

    renderPerformanceChart() {
        const performanceChart = document.getElementById('performanceChart');
        const responseTime = '< 2 minutes';
        const successRate = this.signals.length > 0 ? Math.round((this.responses.length / this.signals.length) * 100) : 0;

        performanceChart.innerHTML = `
            <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                Response Rate: ${successRate}%<br>
                Avg Response Time: ${responseTime}<br>
                Total Responses: ${this.responses.length}
            </div>
        `;
    }

    renderFunnelChart() {
        const funnelChart = document.getElementById('funnelChart');
        const totalSignals = this.signals.length;
        const responded = this.responses.length;
        const contacted = this.signals.filter(s => s.status === 'contacted').length;
        const converted = this.leads.filter(l => l.status === 'qualified').length;

        funnelChart.innerHTML = `
            <div style="color: var(--text-primary); font-size: 14px; line-height: 1.6;">
                Signals: ${totalSignals}<br>
                Responded: ${responded}<br>
                Contacted: ${contacted}<br>
                Qualified: ${converted}
            </div>
        `;
    }

    showLoadingError() {
        const container = document.getElementById('signalsContainer');
        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load signals</h3>
                <p>Please check your connection and try refreshing the page.</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 16px;">
                    <span class="btn-icon">🔄</span>
                    Refresh Page
                </button>
            </div>
        `;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new TenstorrentLeadDetection();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);