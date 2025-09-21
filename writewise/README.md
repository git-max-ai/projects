# WriteWise - Grammar Assistant Chrome Extension

A Chrome extension that provides real-time grammar and spelling checking, similar to Grammarly, to help improve your writing across the web.

## Features

- **Real-time Grammar Checking**: Detects grammar issues as you type
- **Spelling Correction**: Identifies and suggests corrections for misspelled words
- **Smart Suggestions**: Provides contextual writing improvements
- **Universal Support**: Works on text inputs, textareas, and contentEditable elements
- **Visual Feedback**: Highlights issues with different colors for different types of errors
- **Interactive Tooltips**: Click on highlighted text to see suggestions and apply fixes
- **Customizable Settings**: Enable/disable different types of checking
- **Statistics Tracking**: Monitor your writing improvements over time

## Installation

### For Development

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The WriteWise extension should now appear in your extensions list

### For Production

1. Package the extension into a .crx file
2. Install from the Chrome Web Store (when published)

## File Structure

```
writewise/
├── manifest.json          # Extension configuration
├── background.js           # Service worker for background tasks
├── content.js             # Main content script injected into pages
├── content.css            # Styles for highlighting and tooltips
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── icons/                 # Extension icons (16x16, 32x32, 48x48, 128x128)
└── README.md              # This file
```

## How It Works

### Content Script (`content.js`)
- Monitors text input fields and contentEditable elements
- Detects when users are typing and sends text for analysis
- Highlights grammar and spelling issues with visual indicators
- Shows interactive tooltips with suggestions
- Applies corrections when users click on suggestions

### Background Script (`background.js`)
- Handles grammar checking logic (currently uses simple pattern matching)
- Can be extended to integrate with external grammar APIs
- Manages settings and data storage

### Popup Interface (`popup.html/js/css`)
- Provides user interface for extension settings
- Shows writing statistics (issues found, words checked)
- Allows users to manually check current page
- Toggle various checking features on/off

## Customization

### Adding New Grammar Rules

To add new grammar patterns, edit the `patterns` array in `background.js`:

```javascript
const patterns = [
  {
    regex: /your-pattern/gi,
    message: "Your helpful message",
    type: "grammar", // or "spelling", "capitalization"
    suggestion: "corrected text"
  }
  // Add more patterns...
];
```

### Integrating with External APIs

Replace the `checkGrammar` function in `background.js` to integrate with services like:
- LanguageTool API
- Grammarly API (if available)
- OpenAI GPT API for advanced checking
- Custom grammar checking services

Example API integration:

```javascript
async function checkGrammar(text) {
  try {
    const response = await fetch('YOUR_GRAMMAR_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({ text: text })
    });
    
    const data = await response.json();
    return {
      success: true,
      issues: data.matches || [],
      correctedText: data.corrected || text
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Styling Customization

Modify `content.css` to change the appearance of:
- Error highlighting colors
- Tooltip design
- Animation effects
- Dark/light theme support

## Permissions Explained

- `activeTab`: Access content of the currently active tab
- `storage`: Save user settings and statistics
- `scripting`: Inject content scripts into web pages
- `<all_urls>`: Work on all websites (can be restricted to specific domains)

## Privacy & Security

- No text data is sent to external servers by default
- All processing happens locally in the browser
- User settings are stored locally using Chrome's storage API
- Can be configured to work offline completely

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)
- Can be adapted for Firefox with minor manifest changes

## Development

### Building for Production

1. Remove any debug console.log statements
2. Minify JavaScript and CSS files
3. Optimize images in the icons folder
4. Test thoroughly on various websites
5. Package using Chrome Developer Dashboard

### Testing

Test the extension on various types of input fields:
- Standard HTML input fields
- Textareas
- ContentEditable divs
- Rich text editors (TinyMCE, CKEditor, etc.)
- Email clients (Gmail, Outlook Web)
- Social media platforms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use and modify for your projects.

## Future Enhancements

- [ ] Integration with professional grammar APIs
- [ ] Support for multiple languages
- [ ] Advanced style and tone suggestions
- [ ] Plagiarism detection
- [ ] Document-level analysis
- [ ] Team collaboration features
- [ ] Performance metrics and analytics
- [ ] Custom dictionary management
- [ ] Voice-to-text integration

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the documentation wiki
- Contact the development team

---

Built with ❤️ for better writing everywhere on the web.
