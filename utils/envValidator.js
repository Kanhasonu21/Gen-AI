/**
 * Environment validation utilities
 */
import { AppError } from './errorHandler.js';

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
    // Database
    MONGODB_URI: 'MongoDB connection string',
    
    // Authentication
    JWT_SECRET: 'JWT signing secret key',
    
    // Email encryption
    EMAIL_ENCRYPTION_KEY: 'Email encryption secret key',
    
    // Optional but recommended
    NODE_ENV: 'Environment (development/production)',
    PORT: 'Server port number'
};

/**
 * Optional environment variables with default values
 */
const OPTIONAL_ENV_VARS = {
    NODE_ENV: 'development',
    PORT: '4000',
    JWT_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: '12',
    SESSION_TIMEOUT: '1800000', // 30 minutes
    MAX_LOGIN_ATTEMPTS: '5',
    LOCKOUT_DURATION: '1800000' // 30 minutes
};

/**
 * Validate environment variables
 */
export function validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Check required variables
    Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
        if (!process.env[key]) {
            errors.push(`${key} is required (${description})`);
        }
    });

    // Set default values for optional variables
    Object.entries(OPTIONAL_ENV_VARS).forEach(([key, defaultValue]) => {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
            warnings.push(`${key} not set, using default: ${defaultValue}`);
        }
    });

    // Validate specific environment variables
    if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
        warnings.push('NODE_ENV should be one of: development, production, test');
    }

    if (process.env.PORT && (isNaN(process.env.PORT) || parseInt(process.env.PORT) <= 0)) {
        errors.push('PORT must be a positive number');
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters long for security');
    }

    if (process.env.BCRYPT_ROUNDS && (isNaN(process.env.BCRYPT_ROUNDS) || parseInt(process.env.BCRYPT_ROUNDS) < 10)) {
        warnings.push('BCRYPT_ROUNDS should be at least 10 for security');
    }

    // Production-specific validations
    if (process.env.NODE_ENV === 'production') {
        if (process.env.JWT_SECRET === 'your-secret-key-change-this-in-production') {
            errors.push('JWT_SECRET must be changed in production');
        }

        if (process.env.EMAIL_ENCRYPTION_KEY === 'your-email-encryption-secret-key-change-in-production') {
            errors.push('EMAIL_ENCRYPTION_KEY must be changed in production');
        }

        if (!process.env.ALLOWED_ORIGINS) {
            warnings.push('ALLOWED_ORIGINS should be set in production for CORS security');
        }
    }

    // Log warnings
    if (warnings.length > 0) {
        console.warn('⚠️  Environment warnings:');
        warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    // Throw error if any required variables are missing
    if (errors.length > 0) {
        const errorMessage = 'Environment validation failed:\n' + 
            errors.map(error => `  - ${error}`).join('\n');
        throw new AppError(errorMessage, 500, 'ENV_VALIDATION_ERROR');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        config: getEnvironmentConfig()
    };
}

/**
 * Get sanitized environment configuration
 */
export function getEnvironmentConfig() {
    return {
        nodeEnv: process.env.NODE_ENV,
        port: parseInt(process.env.PORT),
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION),
        allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
        // Don't expose sensitive values
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasMongoUri: !!process.env.MONGODB_URI,
        mongoUriPreview: process.env.MONGODB_URI ? 
            process.env.MONGODB_URI.substring(0, 20) + '...' : 
            'Not configured'
    };
}

/**
 * Log environment summary
 */
export function logEnvironmentSummary() {
    const config = getEnvironmentConfig();
    
    console.log('\n📋 Environment Configuration Summary:');
    console.log(`   🌍 Environment: ${config.nodeEnv}`);
    console.log(`   🚪 Port: ${config.port}`);
    console.log(`   🔑 JWT Secret: ${config.hasJwtSecret ? 'Configured' : 'Missing'}`);
    console.log(`   📊 Database: ${config.hasMongoUri ? 'Configured' : 'Missing'}`);
    console.log(`   ⏱️  JWT Expires: ${config.jwtExpiresIn}`);
    console.log(`   🔒 BCrypt Rounds: ${config.bcryptRounds}`);
    
    if (config.nodeEnv === 'production') {
        console.log(`   🌐 Allowed Origins: ${config.allowedOrigins.length > 0 ? config.allowedOrigins.join(', ') : 'All (*)'}`);
    }
    
    console.log('');
}

export default {
    validateEnvironment,
    getEnvironmentConfig,
    logEnvironmentSummary,
    REQUIRED_ENV_VARS,
    OPTIONAL_ENV_VARS
};
