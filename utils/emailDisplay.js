// Frontend email utilities
// This file provides utilities for handling email display and masking in the frontend

const EmailUtils = {
    // Mask email for display (show only first few characters and domain)
    maskEmail(email) {
        if (!email || typeof email !== 'string') {
            return '[Protected Email]';
        }
        
        try {
            const [localPart, domain] = email.split('@');
            if (!localPart || !domain) {
                return '[Protected Email]';
            }
            
            // Show first 2 characters of local part and mask the rest
            const maskedLocal = localPart.length > 2 
                ? localPart.substring(0, 2) + '*'.repeat(Math.max(1, localPart.length - 2))
                : localPart;
            
            return `${maskedLocal}@${domain}`;
        } catch (error) {
            console.error('Error masking email:', error);
            return '[Protected Email]';
        }
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    },

    // Display email safely (for UI components)
    getDisplayEmail(user, maskPartial = false) {
        if (!user || !user.email) {
            return '[No Email]';
        }
        
        if (maskPartial) {
            return this.maskEmail(user.email);
        }
        
        return user.email;
    },

    // Get initials from email (for avatar display)
    getEmailInitials(email) {
        if (!email || typeof email !== 'string') {
            return 'U'; // Default for User
        }
        
        try {
            const [localPart] = email.split('@');
            return localPart.substring(0, 2).toUpperCase();
        } catch (error) {
            return 'U';
        }
    },

    // Format email for display in different contexts
    formatForContext(email, context = 'default') {
        switch (context) {
            case 'profile':
                return email; // Full email for profile page
            case 'public':
                return this.maskEmail(email); // Masked for public display
            case 'header':
                return this.maskEmail(email); // Masked for header display
            case 'avatar':
                return this.getEmailInitials(email); // Initials for avatar
            default:
                return email;
        }
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.EmailUtils = EmailUtils;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailUtils;
}
