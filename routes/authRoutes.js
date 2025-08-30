import express from 'express';
import AuthController from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/validate', AuthController.verifyToken, AuthController.validateToken);

// User profile routes
router.get('/profile', AuthController.verifyToken, AuthController.getProfile);
router.put('/profile', AuthController.verifyToken, AuthController.updateProfile);

export default router;
