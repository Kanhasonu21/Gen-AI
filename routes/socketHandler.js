import ChatController from '../controllers/chatController.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Socket.IO connection handler with authentication
export function handleSocketConnection(io) {
    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
            const decoded = jwt.verify(token, secret);
            
            // Fetch user data from database
            const user = await User.findById(decoded.userId);
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            if (!user.isActive) {
                return next(new Error('Authentication error: Account deactivated'));
            }
            
            // Add user info to socket
            socket.userId = decoded.userId;
            socket.user = {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            };
            
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Authenticated user connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user.email}) - Socket: ${socket.id}`);
        ChatController.handleConnection(socket);
        
        // Handle authentication errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            if (error.message.includes('Authentication error')) {
                socket.emit('auth_error', { message: 'Please login again' });
                socket.disconnect();
            }
        });
    });
}

export default handleSocketConnection;
