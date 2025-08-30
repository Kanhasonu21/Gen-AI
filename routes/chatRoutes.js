import express from 'express';
import ChatController from '../controllers/chatController.js';
import AuthController from '../controllers/authController.js';

const router = express.Router();

// Home route
router.get('/', ChatController.getHome);

// Login route
router.get('/login', ChatController.getLogin);
router.get('/signup', ChatController.getSignup);

// Logout route
router.get('/logout', (req, res) => {
    res.redirect('/login');
});

// Chat interface route
router.get('/chat', ChatController.getChat);

// API route to get user chat data (requires authentication)
router.get('/api/user-data', AuthController.verifyToken, ChatController.getUserChatHistory);

export default router;
