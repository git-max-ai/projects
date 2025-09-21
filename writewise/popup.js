// WriteWise Popup JavaScript
class WriteWisePopup {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        await this.loadStats();
    }

    async loadSettings() {
        const settings = await this.getStorageData(['enabled', 'checkGrammar', 'checkSpelling', 'suggestions']);

        document.getElementById('enableExtension').checked = settings.enabled !== false;
        document.getElementById('checkGrammar').checked = settings.checkGrammar !== false;
        document.getElementById('checkSpelling').checked = settings.checkSpelling !== false;
        document.getElementById('showSuggestions').checked = settings.suggestions !== false;

        this.updateStatus(settings.enabled !== false);
    }

    async loadStats() {
        // Get stats from storage
        const stats = await this.getStorageData(['totalIssuesFound', 'totalWordsChecked']);

        document.getElementById('issuesFound').textContent = stats.totalIssuesFound || 0;
        document.getElementById('wordsChecked').textContent = stats.totalWordsChecked || 0;
    }

    setupEventListeners() {
        // Settings toggles
        document.getElementById('enableExtension').addEventListener('change', (e) => {
            this.saveSetting('enabled', e.target.checked);
            this.updateStatus(e.target.checked);
            this.notifyContentScript();
        });

        document.getElementById('checkGrammar').addEventListener('change', (e) => {
            this.saveSetting('checkGrammar', e.target.checked);
            this.notifyContentScript();
        });

        document.getElementById('checkSpelling').addEventListener('change', (e) => {
            this.saveSetting('checkSpelling', e.target.checked);
            this.notifyContentScript();
        });

        document.getElementById('showSuggestions').addEventListener('change', (e) => {
            this.saveSetting('suggestions', e.target.checked);
            this.notifyContentScript();
        });

        // Action buttons
        document.getElementById('checkCurrentPage').addEventListener('click', () => {
            this.checkCurrentPage();
        });

        document.getElementById('openOptions').addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        });

        // Footer links
        document.getElementById('helpLink').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://github.com/your-username/writewise/wiki' });
        });

        document.getElementById('feedbackLink').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'https://github.com/your-username/writewise/issues' });
        });
    }

    updateStatus(isEnabled) {
        const statusElement = document.getElementById('status');
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('status-text');

        if (isEnabled) {
            indicator.className = 'status-indicator active';
            text.textContent = 'Active';
        } else {
            indicator.className = 'status-indicator inactive';
            text.textContent = 'Inactive';
        }
    }

    async checkCurrentPage() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Inject content script if needed
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            // Send message to content script to check page
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPage' });

            if (response && response.success) {
                // Update stats
                await this.updateStats(response.issuesFound, response.wordsChecked);

                // Show feedback
                this.showNotification(`Found ${response.issuesFound} writing issues`);
            }
        } catch (error) {
            console.error('Error checking current page:', error);
            this.showNotification('Error checking page. Please try again.', 'error');
        }
    }

    async updateStats(issuesFound, wordsChecked) {
        const currentStats = await this.getStorageData(['totalIssuesFound', 'totalWordsChecked']);

        const newStats = {
            totalIssuesFound: (currentStats.totalIssuesFound || 0) + issuesFound,
            totalWordsChecked: (currentStats.totalWordsChecked || 0) + wordsChecked
        };

        await chrome.storage.sync.set(newStats);

        // Update display
        document.getElementById('issuesFound').textContent = newStats.totalIssuesFound;
        document.getElementById('wordsChecked').textContent = newStats.totalWordsChecked;
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideDown 0.3s ease;
      ${type === 'success' ? 'background: #4CAF50; color: white;' : 'background: #f44336; color: white;'}
    `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async notifyContentScript() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'settingsUpdated' });
        } catch (error) {
            // Content script might not be injected yet
            console.log('Could not notify content script:', error);
        }
    }

    saveSetting(key, value) {
        chrome.storage.sync.set({ [key]: value });
    }

    getStorageData(keys) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(keys, resolve);
        });
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WriteWisePopup();
});
