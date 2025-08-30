import { webChatBot } from '../modules/chatbot-web.js';
import { formatMessage } from '../utils/messageFormatter.js';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

class ChatController {
    // Store chat history for each socket
    static chatSessions = new Map();

    // Home page controller
    static getHome(req, res) {
        res.render(
            'login', {
            title: 'AI Chatbot - iMessage Style (EJS)',
            botName: 'AI Assistant'
        }
        )
    }

    // Chat page controller
    static getChat(req, res) {
        res.render('chat', {
            title: 'AI Chatbot - iMessage Style (EJS)',
            botName: 'AI Assistant'
        });
    }

    // Login page controller
    static getLogin(req, res) {
        res.render('login', {
            title: 'Login - AI Assistant'
        });
    }
    // Login signup controller
    static getSignup(req, res) {
        res.render('signup', {
            title: 'Signup - AI Assistant'
        });
    }

    // Socket connection handler
    static handleConnection(socket) {
        console.log('User connected:', socket.id);

        // Initialize chat history for this socket
        ChatController.chatSessions.set(socket.id, [
            new SystemMessage("You are a helpful AI Assistant. Respond in a friendly and informative way.")
        ]);

        // Send welcome message
        ChatController.sendWelcomeMessage(socket);

        // Handle user messages
        socket.on('user_message', (message) => {
            ChatController.handleUserMessage(socket, message);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            ChatController.handleDisconnect(socket);
        });
    }

    // Send welcome message
    static sendWelcomeMessage(socket) {
        const welcomeText = 'Hello! I\'m your AI assistant powered by your chatbot function. How can I help you today?';

        socket.emit('bot_message', {
            text: welcomeText,
            html: formatMessage(welcomeText),
            timestamp: new Date().toLocaleTimeString()
        });
    }

    // Handle user message
    static async handleUserMessage(socket, message) {
        try {
            console.log('Received message:', message);

            // Echo user message
            socket.emit('user_message_echo', {
                text: message,
                timestamp: new Date().toLocaleTimeString()
            });

            // Show typing indicator
            socket.emit('bot_typing', true);

            // Get or create chat history for this socket
            let chat_history = ChatController.chatSessions.get(socket.id) || [
                new SystemMessage("You are a helpful AI Assistant. Respond in a friendly and informative way.")
            ];

            // Add user message to history
            const humanMessage = new HumanMessage(message);
            chat_history.push(humanMessage);

            console.log('Chat history length:', chat_history.length);

            // Get bot response
            const botResponse = await webChatBot(message, chat_history);

            // Add AI response to history
            const aiMessage = new AIMessage(botResponse);
            chat_history.push(aiMessage);

            // Update chat history in storage
            ChatController.chatSessions.set(socket.id, chat_history);

            const formattedResponse = formatMessage(botResponse);
            console.log('Updated chat history length:', chat_history);

            // Send bot response with delay
            setTimeout(() => {
                socket.emit('bot_message', {
                    text: botResponse,
                    html: formattedResponse,
                    timestamp: new Date().toLocaleTimeString()
                });

                socket.emit('bot_typing', false);
            }, 800);

        } catch (error) {
            console.error('Error processing message:', error);
            ChatController.sendErrorMessage(socket);
        }
    }

    // Send error message
    static sendErrorMessage(socket) {
        const errorText = 'Sorry, I encountered an error. Please try again.';

        socket.emit('bot_message', {
            text: errorText,
            html: formatMessage(errorText),
            timestamp: new Date().toLocaleTimeString()
        });

        socket.emit('bot_typing', false);
    }

    // Handle disconnect
    static handleDisconnect(socket) {
        console.log('User disconnected:', socket.id);

        // Clean up chat history for disconnected user
        ChatController.chatSessions.delete(socket.id);
    }
}

export default ChatController;
