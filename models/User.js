import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import emailCrypto from '../utils/emailCrypto.js';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxLength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxLength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
        // Removed lowercase and trim as we'll handle this in encryption
        // Removed match validation as encrypted email won't match email pattern
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters long']
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    profilePicture: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    validTokens: [{
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        }
    }],
    blacklistedTokens: [{
        token: {
            type: String,
            required: true
        },
        blacklistedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true // adds createdAt and updatedAt fields
});

// Index for faster email queries
userSchema.index({ emailHash: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'validTokens.token': 1 });
userSchema.index({ 'blacklistedTokens.token': 1 });

// Encrypt email before saving
userSchema.pre('save', async function(next) {
    try {
        // Handle email encryption if email is modified or new
        if (this.isModified('email') || this.isNew) {
            // Validate email format before encryption
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(this.email)) {
                throw new Error('Please enter a valid email');
            }
            
            // Create searchable hash for the email
            this.emailHash = emailCrypto.createSearchableHash(this.email);
            
            // Encrypt the email
            this.email = emailCrypto.encrypt(this.email);
        }
        
        // Hash password if it has been modified (or is new)
        if (this.isModified('password')) {
            const saltRounds = 12;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to get decrypted email
userSchema.methods.getDecryptedEmail = function() {
    try {
        return emailCrypto.decrypt(this.email);
    } catch (error) {
        console.error('Error decrypting email:', error);
        return null;
    }
};

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method to get full name
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Instance method to add valid token
userSchema.methods.addValidToken = function(token, expiresAt) {
    // Remove expired tokens before adding new one
    this.removeExpiredTokens();
    
    this.validTokens.push({
        token,
        expiresAt
    });
    return this.save();
};

// Instance method to remove expired tokens
userSchema.methods.removeExpiredTokens = function() {
    const now = new Date();
    this.validTokens = this.validTokens.filter(tokenObj => tokenObj.expiresAt > now);
};

// Instance method to blacklist token
userSchema.methods.blacklistToken = function(token) {
    // Remove from valid tokens
    this.validTokens = this.validTokens.filter(tokenObj => tokenObj.token !== token);
    
    // Add to blacklisted tokens if not already there
    const isAlreadyBlacklisted = this.blacklistedTokens.some(tokenObj => tokenObj.token === token);
    if (!isAlreadyBlacklisted) {
        this.blacklistedTokens.push({ token });
    }
    
    return this.save();
};

// Instance method to check if token is valid
userSchema.methods.isTokenValid = function(token) {
    // Check if token is blacklisted
    const isBlacklisted = this.blacklistedTokens.some(tokenObj => tokenObj.token === token);
    if (isBlacklisted) {
        return false;
    }
    
    // Remove expired tokens first
    this.removeExpiredTokens();
    
    // Check if token exists in valid tokens and hasn't expired
    const tokenObj = this.validTokens.find(tokenObj => tokenObj.token === token);
    if (!tokenObj) {
        return false;
    }
    
    // Check if token hasn't expired
    return tokenObj.expiresAt > new Date();
};

// Instance method to logout all devices (blacklist all valid tokens)
userSchema.methods.logoutAllDevices = function() {
    // Move all valid tokens to blacklisted tokens
    this.validTokens.forEach(tokenObj => {
        const isAlreadyBlacklisted = this.blacklistedTokens.some(blacklisted => blacklisted.token === tokenObj.token);
        if (!isAlreadyBlacklisted) {
            this.blacklistedTokens.push({ token: tokenObj.token });
        }
    });
    
    // Clear valid tokens
    this.validTokens = [];
    
    return this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(plainEmail) {
    try {
        // Create hash of the plain email to search for
        const emailHash = emailCrypto.createSearchableHash(plainEmail);
        return this.findOne({ emailHash });
    } catch (error) {
        console.error('Error in findByEmail:', error);
        return null;
    }
};

// Transform JSON output (remove password and decrypt email for frontend)
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.emailHash; // Remove internal hash from response
    
    // Decrypt email for frontend use
    try {
        userObject.email = this.getDecryptedEmail();
    } catch (error) {
        console.error('Error decrypting email for JSON output:', error);
        userObject.email = '[Email Encrypted]'; // Fallback for errors
    }
    
    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
