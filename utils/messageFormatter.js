import { marked } from 'marked';
import hljs from 'highlight.js';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Configure marked for markdown parsing
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

// Configure DOMPurify for HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Function to safely convert markdown to HTML
export function formatMessage(text) {
    try {
        // Convert markdown to HTML
        const html = marked(text);
        // Sanitize HTML to prevent XSS
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
            ALLOWED_ATTR: ['class']
        });
    } catch (error) {
        console.error('Error formatting message:', error);
        // Fallback to plain text with basic escaping
        return text.replace(/[&<>"']/g, function(m) {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[m];
        });
    }
}
