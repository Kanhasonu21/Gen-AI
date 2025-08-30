// Client-side authentication utilities
// This file can be included in HTML pages to handle JWT token operations

const AuthUtils = {
    // Store JWT token and user data
    setAuthData(token, user) {
        localStorage.setItem('authToken', token);
        
        // Ensure email is properly formatted before storing
        if (user && user.email) {
            // Email should already be decrypted by the server's toJSON method
            user.displayEmail = user.email; // Store for easy access
        }
        
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Get JWT token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Get user data
    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    },

    // Clear authentication data (logout)
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    // Make authenticated API requests
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('No authentication token found');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // If token is expired or invalid, redirect to login
        if (response.status === 401) {
            this.clearAuthData();
            window.location.href = '/login';
            return;
        }

        return response;
    },

    // Validate token with server
    async validateToken() {
        try {
            const response = await this.makeAuthenticatedRequest('/auth/validate');
            const data = await response.json();
            
            if (data.success) {
                // Update user data if needed (email will be decrypted by server)
                this.setAuthData(this.getToken(), data.user);
                return true;
            } else {
                this.clearAuthData();
                return false;
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.clearAuthData();
            return false;
        }
    },

    // Logout user
    async logout() {
        try {
            await this.makeAuthenticatedRequest('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuthData();
            window.location.href = '/login';
        }
    },

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.AuthUtils = AuthUtils;
}
