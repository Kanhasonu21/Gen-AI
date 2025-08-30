import CryptoJS from 'crypto-js';

class EmailCrypto {
    constructor() {
        // Use environment variable for encryption key, fallback to default (change in production)
        this.secretKey = process.env.EMAIL_ENCRYPTION_KEY || 'your-email-encryption-secret-key-change-in-production';
    }

    // Encrypt email address
    encrypt(email) {
        try {
            if (!email) return email;
            
            // Convert to lowercase and trim for consistency
            const normalizedEmail = email.toLowerCase().trim();
            
            // Encrypt using AES
            const encrypted = CryptoJS.AES.encrypt(normalizedEmail, this.secretKey).toString();
            return encrypted;
        } catch (error) {
            console.error('Email encryption error:', error);
            throw new Error('Failed to encrypt email');
        }
    }

    // Decrypt email address
    decrypt(encryptedEmail) {
        try {
            if (!encryptedEmail) return encryptedEmail;
            
            // Decrypt using AES
            const bytes = CryptoJS.AES.decrypt(encryptedEmail, this.secretKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decrypted) {
                throw new Error('Failed to decrypt email - invalid data');
            }
            
            return decrypted;
        } catch (error) {
            console.error('Email decryption error:', error);
            throw new Error('Failed to decrypt email');
        }
    }

    // For searching encrypted emails (create hash for comparison)
    createSearchableHash(email) {
        try {
            if (!email) {
                throw new Error('Email is required for hash creation');
            }
            
            const normalizedEmail = email.toLowerCase().trim();
            
            if (!normalizedEmail) {
                throw new Error('Valid email is required for hash creation');
            }
            
            // Validate email format
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(normalizedEmail)) {
                throw new Error('Invalid email format for hash creation');
            }
            
            // Create a hash that can be used for searching/comparison
            const hash = CryptoJS.SHA256(normalizedEmail + this.secretKey).toString();
            return hash;
        } catch (error) {
            console.error('Email hash creation error:', error);
            throw new Error(`Failed to create email hash: ${error.message}`);
        }
    }

    // Verify if plain email matches encrypted email
    verifyEmail(plainEmail, encryptedEmail) {
        try {
            const decryptedEmail = this.decrypt(encryptedEmail);
            return plainEmail.toLowerCase().trim() === decryptedEmail;
        } catch (error) {
            console.error('Email verification error:', error);
            return false;
        }
    }
}

// Create singleton instance
const emailCrypto = new EmailCrypto();

export default emailCrypto;
