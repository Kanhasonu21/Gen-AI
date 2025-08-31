# AI Chat Application

A full-stack real-time chat application powered by OpenAI's GPT models with secure user authentication, responsive design, and modern web technologies.

## ✨ Features

### 🤖 AI-Powered Chat
- **OpenAI Integration**: Leverages GPT models via LangChain for intelligent conversations
- **Real-time Communication**: Socket.IO enables instant message delivery
- **Chat History**: Persistent conversation context for better AI responses
- **Markdown Support**: Rich text formatting with syntax highlighting


## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (local or cloud instance)
- **OpenAI API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kanhasonu21/Gen-AI.git
   cd node
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/chatapp
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
   JWT_EXPIRES_IN=7d
   
   # Email Encryption
   EMAIL_ENCRYPTION_KEY=your_32_character_encryption_key
   
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   
   # Production Only
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

4. **Start the application**
   ```bash
   # Development (with auto-reload)
   npm start
   
   # Production
   NODE_ENV=production node server.js
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:4000`

## 📁 Project Structure

```
├── controllers/           # Request handlers
│   ├── authController.js  # Authentication logic
│   └── chatController.js  # Chat functionality
├── models/               # Database schemas
│   └── User.js          # User model with encryption
├── modules/             # Core AI modules
│   ├── chatbot-web.js   # Web chat interface
│   ├── chatbot.js       # Terminal chat interface
│   ├── chatOpen.js      # OpenAI integration
│   └── embeddings.js    # Vector embeddings
├── public/              # Static assets
│   ├── chat.css         # Chat interface styles
│   ├── login.css        # Authentication styles
│   ├── signup.css       # Registration styles
│   └── static/          # Images and assets
├── routes/              # API routes
│   ├── authRoutes.js    # Authentication endpoints
│   ├── chatRoutes.js    # Chat endpoints
│   └── socketHandler.js # Real-time communication
├── shared/              # Shared utilities
│   ├── connections.js   # AI model connections
│   └── dbConnection.js  # Database connection
├── utils/               # Helper functions
│   ├── auth.js          # Authentication middleware
│   ├── emailCrypto.js   # Email encryption/decryption
│   ├── emailDisplay.js  # Email formatting
│   ├── envValidator.js  # Environment validation
│   ├── errorHandler.js  # Error management
│   └── messageFormatter.js # Message formatting
├── views/               # EJS templates
│   ├── chat.ejs         # Main chat interface
│   ├── login.ejs        # Login page
│   └── signup.ejs       # Registration page
├── scripts/             # Utility scripts
└── server.js            # Application entry point
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/validate-token` - Token validation

### Chat
- `GET /` - Chat interface (requires authentication)
- `POST /chat` - Send message to AI
- `WebSocket /socket.io` - Real-time communication

### Health
- `GET /health` - Application health check

## 🌐 Socket.IO Events

### Client → Server
- `join_room` - Join user's personal chat room
- `chat_message` - Send message to AI
- `disconnect` - Handle user disconnection

### Server → Client
- `bot_response` - AI response to user message
- `error` - Error notifications
- `connection_status` - Connection state updates

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure stateless authentication
- **Token Blacklisting**: Invalidate tokens on logout
- **Email Encryption**: AES encryption for email storage
- **Password Security**: Bcrypt with salt rounds

### Input Validation
- **XSS Protection**: Input sanitization and validation
- **SQL Injection**: MongoDB ODM protection
- **Rate Limiting**: Request throttling (configurable)
- **CORS**: Cross-origin request handling

### Environment Security
- **Environment Validation**: Startup configuration checks
- **Secret Management**: Secure handling of API keys
- **Production Hardening**: Security headers and optimizations

## 📱 Mobile Support

### Responsive Breakpoints
- **1024px+**: Desktop and large tablets
- **768px-1023px**: iPad and medium tablets
- **481px-767px**: Large mobile phones
- **361px-480px**: Standard mobile phones
- **≤360px**: Small mobile phones

### Touch Optimizations
- **44px minimum** touch targets
- **iOS Safari** zoom prevention
- **Touch feedback** for all interactive elements
- **Landscape orientation** support

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start with nodemon (development)
npm run chat       # Start terminal chat interface
npm run chat-ejs   # Start EJS chat server
npm test           # Run tests (placeholder)
```

### Code Quality
- **ES6 Modules**: Modern JavaScript module system
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging for debugging
- **Code Organization**: Modular architecture

### Environment Variables
The application validates all required environment variables on startup:
- Database connection strings
- API keys and secrets
- Security configurations
- Feature flags

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


**OpenAI API Errors**
- Verify API key is valid and has credits
- Check rate limits and quotas
- Ensure model availability

**Token Validation Fails**
- Check JWT_SECRET configuration
- Verify token hasn't been blacklisted
- Ensure system clock is synchronized

**Socket.IO Connection Issues**
- Check CORS configuration
- Verify WebSocket support
- Test with different browsers

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **OpenAI** for GPT models and API
- **LangChain** for AI orchestration
- **Socket.IO** for real-time communication
- **MongoDB** for database solutions
- **Express.js** for web framework

---

**Built with ❤️ using Node.js, Express, Socket.IO, and OpenAI**

For support or questions, please open an issue in the repository.
