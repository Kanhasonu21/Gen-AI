import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

// Import routes and handlers
import chatRoutes from './routes/chatRoutes.js';
import handleSocketConnection from './routes/socketHandler.js';
import connectDB from './shared/dbConnection.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configure Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/', chatRoutes);

// Setup Socket.IO
handleSocketConnection(io);
connectDB();

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`💬 Chat interface available at: http://localhost:${PORT}/chat`);
    console.log(`🏠 Home page available at: http://localhost:${PORT}`);
});
