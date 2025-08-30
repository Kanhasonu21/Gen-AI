import express from 'express';
import ChatController from '../controllers/chatController.js';

const router = express.Router();

// Home route
router.get('/', ChatController.getHome);

// Login route
router.get('/login', ChatController.getLogin);
router.get('/signup', ChatController.getSignup);

// Chat interface route
router.get('/chat', ChatController.getChat);

export default router;
