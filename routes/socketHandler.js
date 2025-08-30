import ChatController from '../controllers/chatController.js';

// Socket.IO connection handler
export function handleSocketConnection(io) {
    io.on('connection', (socket) => {
        ChatController.handleConnection(socket);
    });
}

export default handleSocketConnection;
