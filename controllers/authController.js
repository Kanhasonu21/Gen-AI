import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import emailCrypto from '../utils/emailCrypto.js';

class AuthController {
    static generateToken(userId) {
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        
        return jwt.sign(
            { userId, type: 'access' },
            secret,
            { expiresIn }
        );
    }

    static getTokenExpirationDate() {
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        const hoursMatch = expiresIn.match(/(\d+)h/);
        const daysMatch = expiresIn.match(/(\d+)d/);
        
        let hours = 24;
        if (hoursMatch) {
            hours = parseInt(hoursMatch[1]);
        } else if (daysMatch) {
            hours = parseInt(daysMatch[1]) * 24;
        }
        
        return new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    static async verifyTokenWeb(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1] || 
                         req.headers['x-auth-token'] || 
                         req.query.token ||
                         req.cookies?.authToken;
            
            if (!token) {
                return res.redirect('/login');
            }

            const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
            const decoded = jwt.verify(token, secret);
            
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.redirect('/login?error=user-not-found');
            }

            if (!user.isActive) {
                return res.redirect('/login?error=account-deactivated');
            }

            if (!user.isTokenValid(token)) {
                return res.redirect('/login?error=invalid-token');
            }
            
            req.user = user;
            req.userId = decoded.userId;
            req.token = token;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.redirect('/login?error=expired');
            }
            
            return res.redirect('/login?error=invalid');
        }
    }

    static async verifyToken(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
            const decoded = jwt.verify(token, secret);
            
            // Fetch user data from database
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated.'
                });
            }

            // Check if token is valid using our token management system
            if (!user.isTokenValid(token)) {
                return res.status(401).json({
                    success: false,
                    message: 'Token is invalid or has been revoked.'
                });
            }
            
            // Add user data to request object
            req.user = user;
            req.userId = decoded.userId;
            req.token = token;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                });
            }
            
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
    }

    // Handle user signup
    static async signup(req, res) {
        try {
            
            const { firstName, lastName, email, password, confirmPassword } = req.body;
            
            // Validation
            if (!firstName || !lastName || !email || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            // Validate email format before processing
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Passwords do not match'
                });
            }
            
            // Check if user already exists (using the plain email - the model will handle hashing)
            const existingUser = await User.findByEmail(email.trim());
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            
            // Create new user (email will be encrypted automatically by the User model)
            const newUser = new User({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                password
            });

            const savedUser = await newUser.save();
            
            // Generate JWT token
            const token = AuthController.generateToken(savedUser._id);
            const expiresAt = AuthController.getTokenExpirationDate();
            
            // Add token to user's valid tokens
            await savedUser.addValidToken(token, expiresAt);
            
            // Success response (password is automatically excluded by toJSON method)
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: savedUser.toJSON(),
                token
            });
            
        } catch (error) {
            
            if (error.message && error.message.includes('encrypt')) {
                return res.status(500).json({
                    success: false,
                    message: 'Email processing error. Please try again.'
                });
            }
            
            // Handle mongoose validation errors
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors,
                    details: error.message
                });
            }
            
            // Handle duplicate email error
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyPattern || {})[0];
                if (duplicateField === 'emailHash' || duplicateField === 'email') {
                    return res.status(400).json({
                        success: false,
                        message: 'An account with this email already exists'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'Account already exists'
                });
            }
            
            // Handle missing emailHash error specifically
            if (error.message && error.message.includes('emailHash') && error.message.includes('required')) {
                return res.status(500).json({
                    success: false,
                    message: 'Email processing error. Please check your email format and try again.',
                    details: 'Email hash generation failed'
                });
            }
            
            // Generic error response
            res.status(500).json({
                success: false,
                message: 'Registration failed. Please try again.',
                ...(process.env.NODE_ENV === 'development' && { 
                    error: error.message,
                    stack: error.stack 
                })
            });
        }
    }
    
    // Handle user login
    static async login(req, res) {
        try {
            // Connect to database            
            const { email, password } = req.body;
            
            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Validate email format
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid email address'
                });
            }
            
            // Find user by email (the model will handle hashing for search)
            const user = await User.findByEmail(email.trim());
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            
            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }
            
            // Compare password
            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            
            // Generate JWT token
            const token = AuthController.generateToken(user._id);
            const expiresAt = AuthController.getTokenExpirationDate();
            
            // Add token to user's valid tokens
            await user.addValidToken(token, expiresAt);
            
            // Success response
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: user.toJSON(),
                token
            });
            
        } catch (error) {
            
            if (error.message && (error.message.includes('decrypt') || error.message.includes('hash'))) {
                return res.status(500).json({
                    success: false,
                    message: 'Authentication processing error. Please try again.'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    // Get user profile
    static async getProfile(req, res) {
        try {
            // User data is already available in req.user from middleware
            res.status(200).json({
                success: true,
                user: req.user.toJSON()
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    
    // Update user profile
    static async updateProfile(req, res) {
        try {
            const { firstName, lastName } = req.body;
            
            // Get user from req.user (set by middleware)
            const user = req.user;
            
            // Update fields
            if (firstName) user.firstName = firstName.trim();
            if (lastName) user.lastName = lastName.trim();
            
            const updatedUser = await user.save();
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser.toJSON()
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Handle user logout
    static async logout(req, res) {
        try {
            const token = req.token; // Get token from middleware
            const user = req.user; // Get user from middleware
            
            if (token && user) {
                // Blacklist the current token
                await user.blacklistToken(token);
            }
            
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Handle logout from all devices
    static async logoutAllDevices(req, res) {
        try {
            const user = req.user; // Get user from middleware
            
            // Blacklist all valid tokens
            await user.logoutAllDevices();
            
            res.status(200).json({
                success: true,
                message: 'Logged out from all devices successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Validate token and return user info
    static async validateToken(req, res) {
        try {
            // If we reach here, the token is valid and user data is in req.user (set by middleware)
            const user = req.user;
            
            // Get decrypted email
            const decryptedEmail = user.getDecryptedEmail();
            
            res.status(200).json({
                success: true,
                message: 'Token is valid',
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: decryptedEmail || '[Email Protected]'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default AuthController;
