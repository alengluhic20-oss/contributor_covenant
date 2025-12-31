// MA'AT Lyapunov PR Visualizer
// Renders PR trajectory data on a 2D Lyapunov field

// Configuration constants
const GRID_STEP_SIZE = 50; // pixels
const STABLE_THRESHOLD = 0.7;
const UNSTABLE_THRESHOLD = 0.4;

class LyapunovVisualizer {
    constructor() {
        this.canvas = document.getElementById('lyapunovCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('tooltip');
        
        this.data = null;
        this.showGrid = true;
        this.filterState = 'all';
        
        // Thresholds - could be loaded from config in future
        this.thresholds = {
            stable: STABLE_THRESHOLD,
            unstable: UNSTABLE_THRESHOLD
        };
        
        this.colors = {
            stable: '#28a745',
            unstable: '#ffc107',
            critical: '#dc3545',
            in_flight: '#007bff',
            merged: '#6c757d',
            closed: '#6c757d'
        };
        
        this.setupCanvas();
        this.setupEventListeners();
        this.loadData();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }
    
    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());
        document.getElementById('toggleGridBtn').addEventListener('click', () => this.toggleGrid());
        document.getElementById('filterState').addEventListener('change', (e) => this.setFilter(e.target.value));
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    }
    
    async loadData() {
        try {
            const dataPath = '../data/trajectories.json';
            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`Failed to load trajectory data from ${dataPath} (HTTP ${response.status})`);
            }
            
            this.data = await response.json();
            this.updateStats();
            this.updatePRList();
            this.render();
            
            document.getElementById('lastUpdated').textContent = 
                new Date(this.data.timestamp).toLocaleString();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Unable to load trajectory data. Please check that the data file exists.');
        }
    }
    
    updateStats() {
        if (!this.data || !this.data.summary) return;
        
        const summary = this.data.summary;
        document.getElementById('totalPRs').textContent = summary.total_prs;
        document.getElementById('stablePRs').textContent = summary.stable_count;
        document.getElementById('unstablePRs').textContent = summary.unstable_count;
        document.getElementById('criticalPRs').textContent = summary.critical_count;
        document.getElementById('inFlightPRs').textContent = summary.in_flight_count;
        document.getElementById('avgScore').textContent = summary.average_score.toFixed(3);
    }
    
    updatePRList() {
        if (!this.data || !this.data.trajectories) return;
        
        const container = document.getElementById('prListContainer');
        container.innerHTML = '';
        
        const filteredPRs = this.getFilteredPRs();
        
        filteredPRs.forEach(pr => {
            const item = document.createElement('div');
            item.className = `pr-item ${pr.state}`;
            
            const metrics = pr.points[0]?.metrics || {};
            
            item.innerHTML = `
                <div class="pr-header">
                    <span class="pr-number">#${pr.pr_number}</span>
                    <span class="pr-state ${pr.state}">${pr.state.replace('_', ' ')}</span>
                </div>
                <div class="pr-title">${this.escapeHtml(pr.title)}</div>
                <div class="pr-metrics">
                    <div class="pr-metric">
                        <span class="pr-metric-label">Score:</span>
                        <span class="pr-metric-value">${pr.current_score.toFixed(3)}</span>
                    </div>
                    <div class="pr-metric">
                        <span class="pr-metric-label">Churn:</span>
                        <span class="pr-metric-value">${metrics.code_churn?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="pr-metric">
                        <span class="pr-metric-label">Engagement:</span>
                        <span class="pr-metric-value">${metrics.review_engagement?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="pr-metric">
                        <span class="pr-metric-label">Sentiment:</span>
                        <span class="pr-metric-value">${metrics.conversation_sentiment?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="pr-metric">
                        <span class="pr-metric-label">CI:</span>
                        <span class="pr-metric-value">${metrics.ci_stability?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div class="pr-metric">
                        <span class="pr-metric-label">Conflicts:</span>
                        <span class="pr-metric-value">${metrics.merge_conflicts?.toFixed(2) || 'N/A'}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }
    
    getFilteredPRs() {
        if (!this.data || !this.data.trajectories) return [];
        
        if (this.filterState === 'all') {
            return this.data.trajectories;
        }
        
        return this.data.trajectories.filter(pr => pr.state === this.filterState);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (!this.data) {
            this.drawPlaceholder();
            return;
        }
        
        if (this.showGrid) {
            this.drawGrid();
        }
        
        this.drawLyapunovField();
        this.drawTrajectories();
    }
    
    drawPlaceholder() {
        this.ctx.fillStyle = '#999';
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Loading trajectory data...', this.width / 2, this.height / 2);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.width; x += GRID_STEP_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.height; y += GRID_STEP_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    drawLyapunovField() {
        // Draw background gradient representing stability field
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        
        gradient.addColorStop(0, 'rgba(40, 167, 69, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.1)');
        gradient.addColorStop(1, 'rgba(220, 53, 69, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw threshold lines
        const stableY = this.height * (1 - this.thresholds.stable);
        const unstableY = this.height * (1 - this.thresholds.unstable);
        
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = '#28a745';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, stableY);
        this.ctx.lineTo(this.width, stableY);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#ffc107';
        this.ctx.beginPath();
        this.ctx.moveTo(0, unstableY);
        this.ctx.lineTo(this.width, unstableY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Draw labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Stable (≥${this.thresholds.stable})`, this.width - 10, stableY - 5);
        this.ctx.fillText(`Unstable (≥${this.thresholds.unstable})`, this.width - 10, unstableY - 5);
        this.ctx.fillText(`Critical (<${this.thresholds.unstable})`, this.width - 10, this.height - 10);
    }
    
    drawTrajectories() {
        const filteredPRs = this.getFilteredPRs();
        
        filteredPRs.forEach((pr, index) => {
            const x = (index / filteredPRs.length) * this.width + (this.width / filteredPRs.length / 2);
            const y = this.height * (1 - pr.current_score);
            
            // Draw point
            this.ctx.fillStyle = this.colors[pr.state] || '#999';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Store position for hover detection
            pr._renderX = x;
            pr._renderY = y;
        });
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const filteredPRs = this.getFilteredPRs();
        let hoveredPR = null;
        
        for (const pr of filteredPRs) {
            if (pr._renderX && pr._renderY) {
                const dx = x - pr._renderX;
                const dy = y - pr._renderY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 12) {
                    hoveredPR = pr;
                    break;
                }
            }
        }
        
        if (hoveredPR) {
            this.showTooltip(hoveredPR, e.clientX, e.clientY);
        } else {
            this.hideTooltip();
        }
    }
    
    showTooltip(pr, x, y) {
        const metrics = pr.points[0]?.metrics || {};
        
        this.tooltip.innerHTML = `
            <strong>PR #${pr.pr_number}</strong><br>
            ${this.escapeHtml(pr.title)}<br>
            <br>
            <strong>Score:</strong> ${pr.current_score.toFixed(3)}<br>
            <strong>State:</strong> ${pr.state.replace('_', ' ')}<br>
            <br>
            <strong>Metrics:</strong><br>
            Code Churn: ${metrics.code_churn?.toFixed(3) || 'N/A'}<br>
            Review: ${metrics.review_engagement?.toFixed(3) || 'N/A'}<br>
            Sentiment: ${metrics.conversation_sentiment?.toFixed(3) || 'N/A'}<br>
            CI: ${metrics.ci_stability?.toFixed(3) || 'N/A'}
        `;
        
        this.tooltip.style.left = x + 15 + 'px';
        this.tooltip.style.top = y + 15 + 'px';
        this.tooltip.classList.add('visible');
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.render();
    }
    
    setFilter(state) {
        this.filterState = state;
        this.updatePRList();
        this.render();
    }
    
    showError(message) {
        this.ctx.fillStyle = '#dc3545';
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(message, this.width / 2, this.height / 2);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize visualizer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LyapunovVisualizer();
});
