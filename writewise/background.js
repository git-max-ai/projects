// Background service worker for WriteWise extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('WriteWise extension installed');

    // Set default settings
    chrome.storage.sync.set({
        enabled: true,
        checkGrammar: true,
        checkSpelling: true,
        suggestions: true
    });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkText') {
        checkGrammar(request.text)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep message channel open for async response
    }
});

// Grammar checking function using LanguageTool API
async function checkGrammar(text) {
    try {
        console.log('WriteWise: Checking text with LanguageTool:', text);

        // Use LanguageTool free API
        const response = await fetch('https://api.languagetool.org/v2/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'text': text,
                'language': 'en-US',
                'enabledOnly': 'false'
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('WriteWise: LanguageTool response:', data);

        // Convert LanguageTool format to our format
        const issues = data.matches.map(match => ({
            start: match.offset,
            end: match.offset + match.length,
            original: text.substring(match.offset, match.offset + match.length),
            message: match.message,
            type: categorizeError(match),
            suggestion: match.replacements.length > 0 ? match.replacements[0].value : text.substring(match.offset, match.offset + match.length),
            category: match.rule.category.name
        }));

        return {
            success: true,
            issues: issues,
            correctedText: applySuggestions(text, issues)
        };
    } catch (error) {
        console.error('WriteWise: LanguageTool API error:', error);
        // Fallback to basic patterns if API fails
        const fallbackIssues = findGrammarIssues(text);
        return {
            success: true,
            issues: fallbackIssues,
            correctedText: applySuggestions(text, fallbackIssues),
            fallback: true
        };
    }
}

// Categorize LanguageTool errors into our types
function categorizeError(match) {
    const category = match.rule.category.id.toLowerCase();
    const ruleId = match.rule.id.toLowerCase();

    if (category.includes('typo') || ruleId.includes('spelling') || category.includes('misspelling')) {
        return 'spelling';
    } else if (category.includes('grammar') || category.includes('agreement') || category.includes('tense')) {
        return 'grammar';
    } else if (category.includes('case') || ruleId.includes('uppercase')) {
        return 'capitalization';
    } else if (category.includes('style') || category.includes('redundancy')) {
        return 'style';
    } else {
        return 'grammar';
    }
}

// Enhanced fallback grammar issue detection
function findGrammarIssues(text) {
    const issues = [];

    // Enhanced grammar patterns
    const patterns = [
        // Capitalization issues
        {
            regex: /\bi\s+(?=\w)/gi,
            message: "Capitalize 'I' when used as a pronoun",
            type: "capitalization",
            suggestion: "I "
        },
        {
            regex: /(?:^|\.\s+)([a-z])/g,
            message: "Capitalize the first letter of a sentence",
            type: "capitalization",
            suggestion: (match) => match.toUpperCase()
        },

        // Common spelling mistakes
        {
            regex: /\bteh\b/gi,
            message: "Did you mean 'the'?",
            type: "spelling",
            suggestion: "the"
        },
        {
            regex: /\bthnk\b/gi,
            message: "Did you mean 'think'?",
            type: "spelling",
            suggestion: "think"
        },
        {
            regex: /\bmst\b/gi,
            message: "Did you mean 'most'?",
            type: "spelling",
            suggestion: "most"
        },
        {
            regex: /\bre;evant\b/gi,
            message: "Did you mean 'relevant'?",
            type: "spelling",
            suggestion: "relevant"
        },
        {
            regex: /\bwokring\b/gi,
            message: "Did you mean 'working'?",
            type: "spelling",
            suggestion: "working"
        },
        {
            regex: /\brecieve\b/gi,
            message: "Did you mean 'receive'? (i before e except after c)",
            type: "spelling",
            suggestion: "receive"
        },
        {
            regex: /\boccured\b/gi,
            message: "Did you mean 'occurred'?",
            type: "spelling",
            suggestion: "occurred"
        },
        {
            regex: /\bseperate\b/gi,
            message: "Did you mean 'separate'?",
            type: "spelling",
            suggestion: "separate"
        },
        {
            regex: /\bdefinately\b/gi,
            message: "Did you mean 'definitely'?",
            type: "spelling",
            suggestion: "definitely"
        },
        {
            regex: /\bacomodate\b/gi,
            message: "Did you mean 'accommodate'?",
            type: "spelling",
            suggestion: "accommodate"
        },

        // Grammar issues
        {
            regex: /\byour\s+welcome\b/gi,
            message: "Did you mean 'you're welcome'?",
            type: "grammar",
            suggestion: "you're welcome"
        },
        {
            regex: /\bits\s+own\b/gi,
            message: "Use 'its' for possession (no apostrophe)",
            type: "grammar",
            suggestion: "its own"
        },
        {
            regex: /\bshould\s+of\b/gi,
            message: "Did you mean 'should have'?",
            type: "grammar",
            suggestion: "should have"
        },
        {
            regex: /\bcould\s+of\b/gi,
            message: "Did you mean 'could have'?",
            type: "grammar",
            suggestion: "could have"
        },
        {
            regex: /\bwould\s+of\b/gi,
            message: "Did you mean 'would have'?",
            type: "grammar",
            suggestion: "would have"
        },
        {
            regex: /\bthere\s+own\b/gi,
            message: "Did you mean 'their own'?",
            type: "grammar",
            suggestion: "their own"
        },
        {
            regex: /\bwho's\s+(?:car|house|book|dog|cat|idea)/gi,
            message: "Use 'whose' for possession",
            type: "grammar",
            suggestion: (match) => match.replace("who's", "whose")
        },

        // Word choice and style
        {
            regex: /\bvery\s+unique\b/gi,
            message: "Something cannot be 'very unique' - unique means one of a kind",
            type: "style",
            suggestion: "unique"
        },
        {
            regex: /\bmore\s+better\b/gi,
            message: "Use either 'more' or 'better', not both",
            type: "grammar",
            suggestion: "better"
        },
        {
            regex: /\ba\s+lot\s+of\b/gi,
            message: "Consider 'many' or 'much' for formal writing",
            type: "style",
            suggestion: "many"
        }
    ];

    patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

        while ((match = regex.exec(text)) !== null) {
            const suggestion = typeof pattern.suggestion === 'function'
                ? pattern.suggestion(match[0])
                : pattern.suggestion;

            issues.push({
                start: match.index,
                end: match.index + match[0].length,
                original: match[0],
                message: pattern.message,
                type: pattern.type,
                suggestion: suggestion
            });
        }
    });

    return issues;
}

// Apply suggestions to text
function applySuggestions(text, issues) {
    let correctedText = text;

    // Sort issues by position (reverse order to maintain indices)
    issues.sort((a, b) => b.start - a.start);

    issues.forEach(issue => {
        correctedText = correctedText.substring(0, issue.start) +
            issue.suggestion +
            correctedText.substring(issue.end);
    });

    return correctedText;
}
