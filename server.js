import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import handleSocketConnection from './routes/socketHandler.js';
import connectDB from './shared/dbConnection.js';

import { globalErrorHandler, notFoundHandler } from './utils/errorHandler.js';
import { validateEnvironment, logEnvironmentSummary } from './utils/envValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

process.on('uncaughtException', (error) => {
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    process.exit(1);
});

function createApp() {
    const app = express();

    if (NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/utils', express.static(path.join(__dirname, 'utils')));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (NODE_ENV === 'development') {
        app.use((req, res, next) => {
            next();
        });
    }

    app.use('/', chatRoutes);
    app.use('/auth', authRoutes);

    app.get('/health', (req, res) => {
        res.status(200).json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            env: NODE_ENV,
            port: PORT
        });
    });

    app.use(/(.*)/, notFoundHandler);

    app.use(globalErrorHandler);

    return app;
}

async function initializeServer() {
    try {
        const envValidation = validateEnvironment();
        logEnvironmentSummary();
        
        if (!envValidation.isValid) {
            throw new Error('Environment validation failed');
        }

        await connectDB(process.env.MONGODB_URI);

        const app = createApp();
        const server = createServer(app);
        const io = new Server(server, {
            cors: {
                origin: NODE_ENV === 'production' 
                    ? process.env.ALLOWED_ORIGINS?.split(',') || []
                    : "*",
                methods: ["GET", "POST"]
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        try {
            handleSocketConnection(io);
        } catch (error) {
            throw error;
        }

        setupGracefulShutdown(server);

        await startServer(server);
        
        return { app, server, io };
    } catch (error) {
        process.exit(1);
    }
}

function startServer(server) {
    return new Promise((resolve, reject) => {
        server.listen(PORT, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
            } else {
            }
            reject(error);
        });
    });
}

function setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
        server.close((error) => {
            if (error) {
                process.exit(1);
            }
            
            process.exit(0);
        });

        setTimeout(() => {
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

initializeServer().catch((error) => {
    process.exit(1);
});
