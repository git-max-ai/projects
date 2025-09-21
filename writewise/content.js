// Content script for WriteWise extension
// Prevent multiple initializations
if (window.writeWiseInitialized) {
    console.log('WriteWise: Already initialized, skipping...');
} else {
    window.writeWiseInitialized = true;

    class WriteWiseAssistant {
        constructor() {
            this.isEnabled = true;
            this.activeElement = null;
            this.tooltip = null;
            this.currentIssues = [];
            this.checkTimeout = null;
            this.lastKeystroke = 0;
            this.init();
        }

        async init() {
            // Load settings
            const settings = await this.getSettings();
            this.isEnabled = settings.enabled;

            if (this.isEnabled) {
                this.setupEventListeners();
                this.createTooltip();
            }
        }

        getSettings() {
            return new Promise((resolve) => {
                chrome.storage.sync.get(['enabled', 'checkGrammar', 'checkSpelling'], (result) => {
                    resolve({
                        enabled: result.enabled !== false,
                        checkGrammar: result.checkGrammar !== false,
                        checkSpelling: result.checkSpelling !== false
                    });
                });
            });
        }

        setupEventListeners() {
            console.log('WriteWise: Setting up event listeners');

            // Listen for focus on text inputs
            document.addEventListener('focusin', (e) => {
                if (this.isTextInput(e.target)) {
                    console.log('WriteWise: Text input focused:', e.target.tagName);
                    this.activeElement = e.target;
                    this.addGrammarChecking(e.target);
                }
            });

            // Listen for text changes with immediate feedback
            document.addEventListener('input', (e) => {
                if (this.isTextInput(e.target) && e.target === this.activeElement) {
                    console.log('WriteWise: Text input detected');
                    this.lastKeystroke = Date.now();
                    this.debounceCheck(e.target);
                }
            });

            // Track keystrokes for better cursor handling
            document.addEventListener('keydown', (e) => {
                if (this.isTextInput(e.target)) {
                    this.lastKeystroke = Date.now();
                }
            });

            // Listen for paste events
            document.addEventListener('paste', (e) => {
                if (this.isTextInput(e.target)) {
                    console.log('WriteWise: Paste detected');
                    setTimeout(() => this.checkText(e.target), 100);
                }
            });

            // Listen for focus out
            document.addEventListener('focusout', (e) => {
                if (e.target === this.activeElement) {
                    this.hideTooltip();
                }
            });

            // Hide tooltips when clicking outside
            document.addEventListener('click', (e) => {
                // Don't hide if clicking on a tooltip or highlighted text
                if (!e.target.closest('.writewise-tooltip') &&
                    !e.target.classList.contains('writewise-highlight')) {
                    this.hideTooltip();
                }
            });

            // Initial scan of existing text inputs with content
            setTimeout(() => {
                console.log('WriteWise: Starting initial scan');
                this.scanExistingInputs();
            }, 2000);
        }

        // Scan existing text inputs on page load
        scanExistingInputs() {
            console.log('WriteWise: Scanning existing inputs');
            const textInputs = this.getAllTextInputs();
            console.log('WriteWise: Found', textInputs.length, 'text inputs');

            textInputs.forEach((input, index) => {
                try {
                    // Skip if already processed
                    if (input.dataset.writewiseProcessed) {
                        return;
                    }

                    // For Google Docs, be very selective about content
                    if (window.location.hostname.includes('docs.google.com')) {
                        // Only process elements that are actually in the document editing area
                        const isInDocumentEditor = input.closest('#docs-editor-container') ||
                            input.closest('.kix-page') ||
                            input.classList.contains('kix-lineview') ||
                            input.classList.contains('kix-paragraphrenderer');

                        if (!isInDocumentEditor) {
                            console.log('WriteWise: Skipping Google Docs element outside document editor');
                            return;
                        }

                        // Additional check for Gemini content in Google Docs
                        const parentGeminiIndicators = [
                            '.docs-gm-',
                            '[data-docs-gm]',
                            '.docs-ai-',
                            '[class*="gemini"]',
                            '[class*="ai-generated"]',
                            '.docs-dlg',
                            '.docs-dialog'
                        ];

                        const hasGeminiParent = parentGeminiIndicators.some(indicator => {
                            return input.closest(indicator) !== null;
                        });

                        if (hasGeminiParent) {
                            console.log('WriteWise: Skipping Google Docs element with Gemini/dialog parent');
                            return;
                        }
                    }

                    const text = input.value || input.textContent || input.innerText || '';
                    console.log(`WriteWise: Input ${index + 1} (${input.tagName}): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

                    // Apply enhanced filtering to exclude Gemini content and UI elements
                    if (text.trim().length > 3 && this.looksLikeUserContent(text)) {
                        console.log('WriteWise: Adding grammar checking to input', index + 1);
                        this.addGrammarChecking(input);
                    } else if (text.trim().length > 3) {
                        console.log('WriteWise: Skipping input - appears to be UI/Gemini content:', text.substring(0, 100));
                    }
                } catch (error) {
                    console.error('WriteWise: Error processing input:', error);
                }
            });

            // Additional scan for dynamic content that might load later
            setTimeout(() => {
                console.log('WriteWise: Performing secondary scan for dynamic content...');
                this.scanForDynamicContent();
            }, 5000);
        }

        scanForDynamicContent() {
            // Google Docs specific selectors for the actual document content
            const googleDocsSelectors = [
                '.kix-appview-editor-container',
                '.kix-paragraphrenderer',
                '.kix-wordhtmlgenerator-word-node',
                '[data-kix-text]',
                '.docs-text-line',
                '.docs-paragraph',
                '.kix-lineview-content',
                '.kix-lineview',
                '.notranslate',
                // More specific selectors for actual document content
                '.kix-page',
                '.kix-page-content-wrap',
                '.kix-page-paginated',
                '.kix-paragraphrenderer .kix-wordhtmlgenerator-word-node',
                '[contenteditable="true"]'
            ];

            // Try Google Docs specific selectors first
            let foundGoogleDocsContent = false;
            googleDocsSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const text = element.textContent || element.innerText || '';

                    // Skip Gemini-generated content and UI elements
                    if (text.trim().length > 10 &&
                        !text.includes('File') &&
                        !text.includes('Edit') &&
                        !text.includes('View') &&
                        !text.includes('Gemini created') &&
                        !text.includes('How Gemini takes') &&
                        !text.includes('Drag image') &&
                        !text.includes('reposition') &&
                        !text.includes('Notes created by Gemini') &&
                        !element.classList.contains('writewise-active') &&
                        !element.classList.contains('docs-gm-') && // Skip Gemini-related elements
                        !element.querySelector('.docs-gm-')) { // Skip elements containing Gemini content

                        // Check if this is actually user-editable content
                        if (element.isContentEditable ||
                            element.hasAttribute('contenteditable') ||
                            element.closest('[contenteditable="true"]') ||
                            element.classList.contains('kix-paragraphrenderer')) {

                            console.log(`WriteWise: Found Google Docs editable content (${selector}): "${text.substring(0, 100)}..."`);
                            this.addGrammarChecking(element);
                            foundGoogleDocsContent = true;
                        }
                    }
                });
            });

            // Special handling for Google Docs - look for the main document area
            if (!foundGoogleDocsContent && window.location.hostname.includes('docs.google.com')) {
                console.log('WriteWise: Looking for Google Docs document area specifically...');

                // Try to find the main document container
                const docContainer = document.querySelector('.kix-appview-editor-container, .kix-appview-editor, .docs-texteventtarget-iframe');
                if (docContainer) {
                    console.log('WriteWise: Found Google Docs container, adding grammar checking');
                    this.addGrammarChecking(docContainer);
                    foundGoogleDocsContent = true;
                }

                // Also look for paragraph renderers that might contain user content
                const paragraphs = document.querySelectorAll('.kix-paragraphrenderer');
                paragraphs.forEach(paragraph => {
                    const text = paragraph.textContent || '';
                    if (text.trim().length > 5 &&
                        !text.includes('Gemini') &&
                        !text.includes('Drag image') &&
                        !paragraph.classList.contains('writewise-active')) {
                        console.log('WriteWise: Found paragraph with user content:', text.substring(0, 50));
                        this.addGrammarChecking(paragraph);
                        foundGoogleDocsContent = true;
                    }
                });
            }

            // If no Google Docs content found, fall back to general scanning
            if (!foundGoogleDocsContent) {
                console.log('WriteWise: No Google Docs content found, scanning general elements...');
                const possibleTextContainers = document.querySelectorAll('div, p, span');

                possibleTextContainers.forEach((element, index) => {
                    const text = element.textContent || '';

                    // Look for substantial text content that might be document text
                    if (text.length > 50 &&
                        !element.querySelector('input, button, select') && // Not a form container
                        !element.classList.contains('writewise-tooltip') && // Not our tooltip
                        !element.classList.contains('writewise-active') && // Not already processed
                        !text.includes('Gemini created') && // Skip Gemini content
                        !text.includes('How Gemini takes') &&
                        !text.includes('Drag image') &&
                        window.getComputedStyle(element).display !== 'none') {

                        console.log(`WriteWise: Found potential document text: "${text.substring(0, 100)}..."`);

                        // Make it editable for our purposes if it looks like document content
                        if (text.split(' ').length > 10) { // Has multiple words
                            console.log('WriteWise: Adding checking to potential document element');
                            this.addGrammarChecking(element);
                        }
                    }
                });
            }

            // Monitor for new content being added (like when user types)
            this.setupMutationObserver();
        }

        setupMutationObserver() {
            // Set up a mutation observer to detect when content changes in Google Docs
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
            }

            this.mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // Check if any text nodes were added or modified
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const target = mutation.target;

                        // Ensure target exists and has necessary properties
                        if (!target || !target.textContent) return;

                        const text = target.textContent || target.innerText || '';

                        // Look for meaningful text content, but exclude Gemini content
                        if (text.trim().length > 10 &&
                            !text.includes('File') &&
                            !text.includes('Edit') &&
                            !text.includes('window.__') &&
                            !text.includes('sidebar') &&
                            !text.includes('Plus') &&
                            !text.includes('memory') &&
                            !text.includes('Gemini created') &&
                            !text.includes('How Gemini takes') &&
                            !text.includes('Drag image') &&
                            !text.includes('reposition') &&
                            !text.includes('Notes created by Gemini') &&
                            target.classList &&
                            !target.classList.contains('writewise-active') &&
                            !target.classList.contains('docs-gm-')) { // Skip Gemini-related elements

                            console.log(`WriteWise: Detected content change: "${text.substring(0, 50)}..."`);

                            // Check if this looks like user-typed content
                            if (this.looksLikeUserContent(text)) {
                                console.log('WriteWise: Adding checking to newly detected content');
                                this.addGrammarChecking(target);
                            }

                            // Special handling for Google Docs - if we detect typing in a paragraph
                            if (window.location.hostname.includes('docs.google.com') &&
                                (target.classList.contains('kix-paragraphrenderer') ||
                                    target.closest('.kix-paragraphrenderer') ||
                                    target.classList.contains('kix-wordhtmlgenerator-word-node'))) {
                                console.log('WriteWise: Detected typing in Google Docs paragraph');

                                // Find the parent paragraph container
                                const paragraph = target.closest('.kix-paragraphrenderer') || target;
                                if (paragraph && !paragraph.classList.contains('writewise-active')) {
                                    this.addGrammarChecking(paragraph);
                                }
                            }
                        }
                    }
                });
            });

            // Observe the entire document for changes
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });

            console.log('WriteWise: Mutation observer set up for content changes');
        }

        looksLikeUserContent(text) {
            // Enhanced heuristics to identify user-typed content vs UI elements
            const excludePatterns = [
                'window.__',
                'sidebar',
                'Get Plus',
                'Saved memory',
                'logHTML',
                'SSR_HTML',
                'SSR_TTI',
                'Date.now',
                'Barbara ka tools',
                'Open sidebar',
                'This chat won\'t appear',
                'ChatGPT\'s memory',
                'train our models',
                'SPELLING',
                'Possible',
                'Ctrl+',
                'keyboard',
                'shortcut',
                'preloaded using link',
                // Gemini-specific exclusions - more comprehensive
                'Gemini created these notes',
                'Gemini created',
                'How Gemini takes notes',
                'How Gemini takes',
                'Drag image to reposition',
                'Drag image',
                'Notes created by Gemini',
                'They can contain errors',
                'should be double-checked',
                'can contain errors',
                'double-checked',
                'contain errors',
                'created these notes'
            ];

            // Check if text contains any exclude patterns - case insensitive
            const containsExcludedContent = excludePatterns.some(pattern =>
                text.toLowerCase().includes(pattern.toLowerCase())
            );

            if (containsExcludedContent) {
                console.log('WriteWise: Content excluded due to pattern match:', text.substring(0, 100));
                return false;
            }

            // Additional check for Gemini-style content patterns
            if (text.toLowerCase().includes('gemini') ||
                text.toLowerCase().includes('ai-generated') ||
                text.toLowerCase().includes('automatically generated') ||
                (text.toLowerCase().includes('notes') && text.toLowerCase().includes('created')) ||
                (text.toLowerCase().includes('drag') && text.toLowerCase().includes('image'))) {
                console.log('WriteWise: Content excluded - appears to be AI/Gemini generated:', text.substring(0, 100));
                return false;
            }

            const userContentIndicators = [
                text.length > 20 && text.length < 500, // Reasonable length for user content
                text.split(' ').length > 3 && text.split(' ').length < 100, // Reasonable word count
                !text.includes('function'),
                !text.includes('var '),
                !text.includes('const '),
                !text.includes('getElementById'),
                !/^[A-Z_]{3,}$/.test(text), // Not all caps constants
                !/^\d+$/.test(text.trim()), // Not just numbers
                !text.includes('http'),
                !text.includes('www.'),
                !text.toLowerCase().includes('gemini'), // Exclude any Gemini references
                !text.toLowerCase().includes('ai-generated') // Exclude AI-generated content
            ];

            // If most indicators are true, it's likely user content
            const trueCount = userContentIndicators.filter(Boolean).length;
            const isUserContent = trueCount >= userContentIndicators.length * 0.8;

            if (!isUserContent) {
                console.log('WriteWise: Content failed user content indicators:', text.substring(0, 100));
            }

            return isUserContent;
        }

        isTextInput(element) {
            var textInputTypes = ['text', 'email', 'password', 'search', 'url'];

            // Standard form inputs
            if (element.tagName === 'TEXTAREA' ||
                (element.tagName === 'INPUT' && textInputTypes.includes(element.type))) {
                return true;
            }

            // ContentEditable elements
            if (element.contentEditable === 'true' || element.isContentEditable) {
                return true;
            }

            // Rich text editors and special cases
            if (element.hasAttribute('role') && element.getAttribute('role') === 'textbox') {
                return true;
            }

            // Google Docs specific elements
            if (element.classList.contains('kix-wordhtmlgenerator-word-node') ||
                element.classList.contains('docs-texteventtarget-iframe') ||
                element.hasAttribute('data-docs-text')) {
                return true;
            }

            return false;
        }

        addGrammarChecking(element) {
            console.log('WriteWise: Adding grammar checking to element:', element.tagName);

            // Double-check the content before adding grammar checking
            const text = element.value || element.textContent || '';

            // Skip if this appears to be Gemini or UI content
            if (!this.looksLikeUserContent(text)) {
                console.log('WriteWise: Skipping element - content appears to be UI/Gemini content:', text.substring(0, 100));
                return;
            }

            // Add visual indicator that grammar checking is active
            element.classList.add('writewise-active');

            // Check text immediately if there's content
            if (text.trim().length > 0) {
                console.log('WriteWise: Checking existing text:', text.substring(0, 50));
                this.checkText(element);
            }
        }

        debounceCheck(element) {
            clearTimeout(this.checkTimeout);
            console.log('WriteWise: Debouncing text check...');
            this.checkTimeout = setTimeout(() => {
                console.log('WriteWise: Executing debounced check');
                this.checkText(element);
            }, 800); // Reduced from 1200ms to be more responsive while still preventing excessive calls
        }

        async checkText(element) {
            const text = element.value || element.textContent || '';
            console.log('WriteWise: Checking text of length:', text.length);

            if (text.trim().length < 3) {
                console.log('WriteWise: Text too short, clearing highlights');
                this.clearHighlights(element);
                return;
            }

            try {
                console.log('WriteWise: Sending text to background script...');
                const response = await chrome.runtime.sendMessage({
                    action: 'checkText',
                    text: text
                });

                console.log('WriteWise: Received response:', response);

                if (response && response.success) {
                    this.currentIssues = response.issues || [];
                    console.log('WriteWise: Found', this.currentIssues.length, 'issues');

                    // Always attempt to highlight issues, but be smart about timing
                    const isRecentlyTyping = Date.now() - this.lastKeystroke < 200;
                    if (isRecentlyTyping && element.isContentEditable) {
                        console.log('WriteWise: Delaying highlight update due to recent typing');
                        setTimeout(() => {
                            this.highlightIssues(element, this.currentIssues);
                        }, 300);
                    } else {
                        console.log('WriteWise: Highlighting issues immediately');
                        this.highlightIssues(element, this.currentIssues);
                    }
                } else {
                    console.error('WriteWise: No success in response:', response);
                }
            } catch (error) {
                console.error('WriteWise: Error checking text:', error);
            }
        }

        highlightIssues(element, issues) {
            this.clearHighlights(element);

            if (issues.length === 0) return;

            // Check if this is a Google Docs element that should be treated as contentEditable
            const isGoogleDocsElement = this.isGoogleDocsElement(element);

            // For contentEditable elements or Google Docs elements
            if (element.isContentEditable || isGoogleDocsElement) {
                console.log('WriteWise: Using contentEditable highlighting for', element.tagName, isGoogleDocsElement ? '(Google Docs)' : '(contentEditable)');
                this.highlightContentEditable(element, issues);
            } else {
                console.log('WriteWise: Using input field highlighting for', element.tagName);
                // For input/textarea elements
                this.highlightInputField(element, issues);
            }
        }

        // Helper method to detect Google Docs elements that should show inline highlights
        isGoogleDocsElement(element) {
            // Check for Google Docs specific classes and containers
            const googleDocsClasses = [
                'kix-appview-editor-container',
                'kix-paragraphrenderer',
                'kix-wordhtmlgenerator-word-node',
                'kix-lineview-content',
                'kix-lineview',
                'docs-text-line',
                'docs-paragraph'
            ];

            // Check if element or its parents have Google Docs classes
            let current = element;
            for (let i = 0; i < 5 && current; i++) { // Check up to 5 levels up
                if (current.classList) {
                    for (const className of googleDocsClasses) {
                        if (current.classList.contains(className)) {
                            return true;
                        }
                    }
                }

                // Check for Google Docs attributes
                if (current.hasAttribute && (
                    current.hasAttribute('data-kix-text') ||
                    current.hasAttribute('data-docs-text')
                )) {
                    return true;
                }

                current = current.parentElement;
            }

            // Check if we're in a Google Docs URL
            if (window.location.hostname.includes('docs.google.com')) {
                // If we're in Google Docs and this element has meaningful text content
                const text = element.textContent || '';
                if (text.trim().length > 10 &&
                    !text.includes('File') &&
                    !text.includes('Edit') &&
                    !text.includes('View') &&
                    element.tagName === 'DIV') {
                    return true;
                }
            }

            return false;
        }

        highlightContentEditable(element, issues) {
            console.log(`WriteWise: Attempting to highlight ${issues.length} issues in contentEditable element`);
            const text = element.textContent;

            // Skip highlighting for very complex Google Docs elements to avoid breaking them
            if (element.classList.contains('kix-appview-editor-container') && text.length > 1000) {
                console.log('WriteWise: Complex Google Docs element detected, using simplified highlighting');
                this.highlightInputField(element, issues);
                return;
            }

            // For Google Docs, we might need to be more careful about DOM manipulation
            const isGoogleDocs = this.isGoogleDocsElement(element) || window.location.hostname.includes('docs.google.com');

            if (isGoogleDocs) {
                console.log('WriteWise: Google Docs element detected, using enhanced highlighting');
            }

            // Store detailed cursor position before modifying content
            const selection = window.getSelection();
            let savedRange = null;
            let cursorOffset = 0;

            try {
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    // Save the range for later restoration
                    savedRange = {
                        startContainer: range.startContainer,
                        startOffset: range.startOffset,
                        endContainer: range.endContainer,
                        endOffset: range.endOffset
                    };

                    // Calculate cursor position in text
                    cursorOffset = this.getTextOffset(element, range.startContainer, range.startOffset);
                    console.log('WriteWise: Saved cursor position at offset:', cursorOffset);
                }
            } catch (e) {
                console.log('WriteWise: Could not save cursor position:', e);
            }

            // Store the original HTML to check if we need to update
            const originalHTML = element.innerHTML;

            let html = '';
            let lastIndex = 0;

            // Sort issues by start position
            issues.sort((a, b) => a.start - b.start);

            console.log('WriteWise: Building highlighted HTML...');
            issues.forEach((issue, index) => {
                // Add text before the issue
                html += this.escapeHtml(text.substring(lastIndex, issue.start));

                // Add highlighted issue with Grammarly-like styling
                const highlightClass = `writewise-highlight writewise-${issue.type}`;
                const highlightStart = `<span class="${highlightClass}" data-issue-id="${index}" title="${this.escapeHtml(issue.message)}" style="position: relative; z-index: 1;">`;
                const highlightEnd = '</span>';

                html += highlightStart;
                html += this.escapeHtml(text.substring(issue.start, issue.end));
                html += highlightEnd;

                console.log(`WriteWise: Added highlight for "${text.substring(issue.start, issue.end)}" (${issue.type})`);
                lastIndex = issue.end;
            });

            // Add remaining text
            html += this.escapeHtml(text.substring(lastIndex));

            // Always update the HTML to show highlights
            try {
                console.log('WriteWise: Updating element HTML with highlights');

                // For Google Docs, we need to be more careful about DOM updates
                if (isGoogleDocs) {
                    // Try a gentler approach for Google Docs
                    setTimeout(() => {
                        try {
                            element.innerHTML = html;
                            console.log('WriteWise: Google Docs HTML updated successfully');
                            this.addHighlightClickListeners(element, issues);
                        } catch (error) {
                            console.log('WriteWise: Google Docs HTML update failed, using border indicator');
                            this.highlightInputField(element, issues);
                        }
                    }, 10);
                } else {
                    element.innerHTML = html;
                    this.addHighlightClickListeners(element, issues);
                }

                // Restore cursor position after a short delay to ensure DOM is updated
                if (savedRange && !isGoogleDocs) { // Skip cursor restoration for Google Docs to avoid conflicts
                    setTimeout(() => {
                        this.restoreCursorPosition(element, cursorOffset);
                    }, 50);
                }

                console.log(`WriteWise: Successfully highlighted ${issues.length} issues in element`);
            } catch (error) {
                console.error('WriteWise: Error updating element HTML:', error);
                console.log('WriteWise: Falling back to border indicator');
                this.highlightInputField(element, issues);
            }
        }

        // Helper method to add click listeners to highlights
        addHighlightClickListeners(element, issues) {
            const highlights = element.querySelectorAll('.writewise-highlight');
            console.log('WriteWise: Added', highlights.length, 'highlight elements');

            highlights.forEach(highlight => {
                highlight.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const issueId = parseInt(e.target.getAttribute('data-issue-id'));
                    if (issues[issueId]) {
                        console.log('WriteWise: Highlight clicked, showing suggestion');
                        this.showSuggestion(e.target, issues[issueId]);
                    }
                });
            });
        }        // Helper method to get text offset from cursor position
        getTextOffset(element, container, offset) {
            let textOffset = 0;
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                if (node === container) {
                    return textOffset + offset;
                }
                textOffset += node.textContent.length;
            }
            return textOffset;
        }

        // Helper method to restore cursor position by text offset
        restoreCursorPosition(element, textOffset) {
            try {
                const selection = window.getSelection();
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                let currentOffset = 0;
                let node;

                while (node = walker.nextNode()) {
                    const nodeLength = node.textContent.length;
                    if (currentOffset + nodeLength >= textOffset) {
                        const range = document.createRange();
                        const offsetInNode = Math.min(textOffset - currentOffset, nodeLength);
                        range.setStart(node, offsetInNode);
                        range.setEnd(node, offsetInNode);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        return;
                    }
                    currentOffset += nodeLength;
                }

                // If we couldn't find the exact position, place cursor at end
                if (element.lastChild && element.lastChild.nodeType === Node.TEXT_NODE) {
                    const range = document.createRange();
                    range.setStart(element.lastChild, element.lastChild.textContent.length);
                    range.setEnd(element.lastChild, element.lastChild.textContent.length);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } catch (error) {
                console.log('WriteWise: Could not restore cursor position:', error);
            }
        }

        highlightInputField(element, issues) {
            console.log(`WriteWise: Highlighting input field with ${issues.length} issues`);

            // Enhanced visual indicator for input fields and complex elements
            if (issues.length > 0) {
                // Color-code border based on most severe issue type
                const severityOrder = ['spelling', 'grammar', 'style', 'capitalization'];
                const mostSevere = issues.reduce((prev, curr) => {
                    const prevIndex = severityOrder.indexOf(prev.type);
                    const currIndex = severityOrder.indexOf(curr.type);
                    return currIndex < prevIndex ? curr : prev;
                });

                const colors = {
                    spelling: '#ff5757',
                    grammar: '#ffc107',
                    style: '#9c27b0',
                    capitalization: '#4caf50'
                };

                const color = colors[mostSevere.type] || '#ff5757';

                element.style.borderLeft = `4px solid ${color}`;
                element.style.boxShadow = `inset 3px 0 0 ${color}40`;
                element.title = `${issues.length} writing issue(s) found - Click to see details`;

                // Add pulsing animation for visibility
                element.style.animation = 'writewise-pulse 2s infinite';

                console.log(`WriteWise: Added visual indicator for ${issues.length} issues (${mostSevere.type}) with color ${color}`);

                // Remove any existing click listeners to avoid duplicates
                element.removeEventListener('click', this.tooltipClickHandler);

                // Create a bound handler we can remove later
                this.tooltipClickHandler = (e) => {
                    if (issues.length > 0) {
                        console.log('WriteWise: Input field clicked, showing tooltip for first issue');
                        this.showTooltip(element, issues[0]);
                    }
                };

                element.addEventListener('click', this.tooltipClickHandler);
            } else {
                console.log('WriteWise: No issues, clearing highlights');
                this.clearHighlights(element);
            }
        }

        showSuggestion(target, issue) {
            this.showTooltip(target, issue, true);
        }

        showTooltip(element, issue, showFix = false) {
            // Hide any existing tooltips first
            this.hideTooltip();

            // Also hide any other writewise tooltips that might exist
            const allTooltips = document.querySelectorAll('.writewise-tooltip');
            allTooltips.forEach(tooltip => {
                if (tooltip !== this.tooltip) {
                    tooltip.style.display = 'none';
                }
            });

            if (!this.tooltip) {
                console.log('WriteWise: Tooltip not created, creating now');
                this.createTooltip();
            }

            const rect = element.getBoundingClientRect();
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = Math.max(10, rect.left) + 'px';
            this.tooltip.style.top = (rect.bottom + 10) + 'px';
            this.tooltip.style.zIndex = '999999';
            this.tooltip.style.position = 'fixed';

            // Better error type display
            const typeLabels = {
                'spelling': 'Spelling',
                'grammar': 'Grammar',
                'style': 'Style',
                'capitalization': 'Capitalization'
            };

            const typeColors = {
                'spelling': '#ff5757',
                'grammar': '#ffc107',
                'style': '#9c27b0',
                'capitalization': '#4caf50'
            };

            const typeLabel = typeLabels[issue.type] || issue.type.toUpperCase();
            const typeColor = typeColors[issue.type] || '#666';

            const content = showFix ?
                `
                <div class="writewise-tooltip-header" style="color: ${typeColor}; border-left: 3px solid ${typeColor}; padding-left: 8px;">
                    ${typeLabel} Issue
                </div>
                <div class="writewise-tooltip-message">${issue.message}</div>
                <div class="writewise-tooltip-suggestion">
                    <strong style="color: ${typeColor};">Suggestion:</strong> "${issue.suggestion}"
                </div>
                <div class="writewise-tooltip-actions">
                    <button class="writewise-btn-apply" style="background: ${typeColor};" data-original="${issue.original}" data-suggestion="${issue.suggestion}">
                        Apply Fix
                    </button>
                    <button class="writewise-btn-ignore">Ignore</button>
                </div>
            ` :
                `
                <div class="writewise-tooltip-header" style="color: ${typeColor}; border-left: 3px solid ${typeColor}; padding-left: 8px;">
                    ${typeLabel} Issue
                </div>
                <div class="writewise-tooltip-message">${issue.message}</div>
                <div class="writewise-tooltip-note" style="color: #888; font-size: 12px; margin-top: 8px;">
                    Click the highlighted text to see suggestions
                </div>
            `;

            this.tooltip.innerHTML = content;

            // Add event listeners for buttons
            if (showFix) {
                const applyBtn = this.tooltip.querySelector('.writewise-btn-apply');
                const ignoreBtn = this.tooltip.querySelector('.writewise-btn-ignore');

                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        this.applySuggestion(element, issue);
                        this.hideTooltip();
                    });
                }

                if (ignoreBtn) {
                    ignoreBtn.addEventListener('click', () => {
                        this.hideTooltip();
                    });
                }
            }

            // Auto-hide tooltip after 5 seconds
            setTimeout(() => {
                if (this.tooltip && this.tooltip.style.display === 'block') {
                    this.hideTooltip();
                }
            }, 5000);

            console.log('WriteWise: Tooltip displayed for', typeLabel, 'issue');
        }

        applySuggestion(element, issue) {
            if (element.isContentEditable) {
                const currentText = element.textContent;
                const newText = currentText.substring(0, issue.start) +
                    issue.suggestion +
                    currentText.substring(issue.end);
                element.textContent = newText;
            } else {
                const currentText = element.value;
                const newText = currentText.substring(0, issue.start) +
                    issue.suggestion +
                    currentText.substring(issue.end);
                element.value = newText;
            }

            // Trigger input event
            element.dispatchEvent(new Event('input', { bubbles: true }));

            // Recheck text after applying suggestion
            setTimeout(() => this.checkText(element), 100);
        }

        hideTooltip() {
            if (this.tooltip) {
                this.tooltip.style.display = 'none';
            }

            // Also hide any other writewise tooltips that might exist (cleanup)
            const allTooltips = document.querySelectorAll('.writewise-tooltip');
            allTooltips.forEach(tooltip => {
                tooltip.style.display = 'none';
            });

            console.log('WriteWise: All tooltips hidden');
        }

        createTooltip() {
            // Check if tooltip already exists to prevent duplicates
            if (this.tooltip) {
                console.log('WriteWise: Tooltip already exists, skipping creation');
                return;
            }

            // Remove any existing tooltips from previous instances
            const existingTooltips = document.querySelectorAll('.writewise-tooltip');
            existingTooltips.forEach(tooltip => {
                console.log('WriteWise: Removing existing tooltip');
                tooltip.remove();
            });

            this.tooltip = document.createElement('div');
            this.tooltip.className = 'writewise-tooltip';
            this.tooltip.style.display = 'none';
            this.tooltip.style.position = 'fixed';
            this.tooltip.style.zIndex = '999999';
            document.body.appendChild(this.tooltip);

            console.log('WriteWise: Created new tooltip element');
        }

        clearHighlights(element) {
            element.style.borderLeft = '';
            element.title = '';

            // Remove highlights from contentEditable
            if (element.isContentEditable) {
                const highlights = element.querySelectorAll('.writewise-highlight');
                highlights.forEach(highlight => {
                    const parent = highlight.parentNode;
                    parent.insertBefore(document.createTextNode(highlight.textContent), highlight);
                    parent.removeChild(highlight);
                });
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Check all text inputs on the current page
        async checkCurrentPage() {
            console.log('WriteWise: Starting comprehensive page check...');
            let totalIssues = 0;
            let totalWords = 0;

            // Get all inputs including dynamically found ones
            const basicInputs = this.getAllTextInputs();

            // Also get all currently active elements that we've been monitoring
            const activeElements = document.querySelectorAll('.writewise-active');

            // Combine both lists and remove duplicates
            const allInputs = [...new Set([...basicInputs, ...activeElements])];

            console.log('WriteWise: Checking', allInputs.length, 'total elements for page check');

            for (const input of allInputs) {
                const text = input.value || input.textContent || input.innerText || '';
                if (text.trim().length > 0) {
                    console.log(`WriteWise: Page check - processing: "${text.substring(0, 50)}..."`);
                    totalWords += text.split(/\s+/).length;
                    await this.checkText(input);
                    totalIssues += this.currentIssues.length;
                }
            }

            console.log(`WriteWise: Page check complete - ${totalIssues} issues found in ${totalWords} words`);
            return {
                success: true,
                issuesFound: totalIssues,
                wordsChecked: totalWords,
                inputsChecked: allInputs.length
            };
        }

        // Get all text inputs on the page
        getAllTextInputs() {
            const inputs = [];

            // Get input fields
            const inputElements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], input[type="url"], textarea');
            inputs.push(...inputElements);

            // Get contentEditable elements with enhanced filtering for Google Docs
            let editableElements;
            if (window.location.hostname.includes('docs.google.com')) {
                // For Google Docs, be very specific about what we target
                editableElements = document.querySelectorAll([
                    '#docs-editor-container [contenteditable="true"]',
                    '.kix-page [contenteditable="true"]',
                    '.kix-lineview[contenteditable="true"]',
                    '.kix-paragraphrenderer[contenteditable="true"]'
                ].join(','));

                // Filter out Gemini-related elements
                editableElements = Array.from(editableElements).filter(el => {
                    // Check for Gemini-specific classes or attributes
                    const geminiIndicators = [
                        'docs-gm-',
                        'docs-ai-',
                        'gemini',
                        'ai-generated'
                    ];

                    const className = el.className || '';
                    const hasGeminiClass = geminiIndicators.some(indicator =>
                        className.toLowerCase().includes(indicator)
                    );

                    if (hasGeminiClass) {
                        console.log('WriteWise: Filtering out Gemini element with class:', className);
                        return false;
                    }

                    // Check parent elements for Gemini indicators
                    let parent = el.parentElement;
                    while (parent && parent !== document.body) {
                        const parentClass = parent.className || '';
                        const hasGeminiParent = geminiIndicators.some(indicator =>
                            parentClass.toLowerCase().includes(indicator)
                        );

                        if (hasGeminiParent) {
                            console.log('WriteWise: Filtering out element with Gemini parent:', parentClass);
                            return false;
                        }
                        parent = parent.parentElement;
                    }

                    return true;
                });
            } else {
                // For other sites, use standard selector
                editableElements = document.querySelectorAll('[contenteditable="true"], [contenteditable=""], [contenteditable]');
            }

            inputs.push(...editableElements);

            // Special handling for Google Docs and similar rich text editors
            const richTextSelectors = [
                '.docs-texteventtarget-iframe',
                '.kix-wordhtmlgenerator-word-node',
                '[role="textbox"]',
                '.notranslate',
                '[aria-label*="document"]',
                '[data-docs-text]'
            ];

            richTextSelectors.forEach(selector => {
                const richTextElements = document.querySelectorAll(selector);
                richTextElements.forEach(el => {
                    // Additional filtering for Google Docs rich text elements
                    if (window.location.hostname.includes('docs.google.com')) {
                        // Only include if it's within the document editor area
                        const isInEditor = el.closest('#docs-editor-container') ||
                            el.closest('.kix-page') ||
                            el.closest('.kix-appview-editor');

                        if (!isInEditor) {
                            return;
                        }
                    }

                    if (el.textContent && el.textContent.trim().length > 0) {
                        inputs.push(el);
                    }
                });
            });

            // Filter out hidden elements and duplicates
            const uniqueInputs = [...new Set(inputs)];
            return uniqueInputs.filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0;
            });
        }

        // Handle settings updates
        async updateSettings() {
            const settings = await this.getSettings();
            this.isEnabled = settings.enabled;

            if (!this.isEnabled) {
                // Clear all highlights if disabled
                this.getAllTextInputs().forEach(input => this.clearHighlights(input));
            }
        }
    }

    // Global instance for message handling
    let writeWiseInstance = null;

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('WriteWise: Received message:', request);

        if (request.action === 'checkPage') {
            if (writeWiseInstance) {
                console.log('WriteWise: Starting page check...');
                writeWiseInstance.checkCurrentPage()
                    .then(result => {
                        console.log('WriteWise: Page check result:', result);
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error('WriteWise: Page check error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
            } else {
                console.error('WriteWise: Instance not initialized');
                sendResponse({ success: false, error: 'WriteWise not initialized' });
            }
            return true; // Keep message channel open for async response
        } else if (request.action === 'settingsUpdated') {
            if (writeWiseInstance) {
                writeWiseInstance.updateSettings();
            }
            sendResponse({ success: true });
        }
    });

    // Initialize WriteWise when the page loads
    function initializeWriteWise() {
        if (!writeWiseInstance) {
            console.log('WriteWise: Initializing new instance');
            writeWiseInstance = new WriteWiseAssistant();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWriteWise);
    } else {
        initializeWriteWise();
    }
}
