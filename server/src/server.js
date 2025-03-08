import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocketServer from './websocket/server.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import RedisClient from './config/redisClient.js';

// Load environment variables
dotenv.config();

class ChatServer {
  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.wsServer = null;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.connectDatabase();
    this.connectRedis();
  }

  initializeMiddlewares() {
    // Middleware configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  initializeRoutes() {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/messages', messageRoutes);

    // Healthcheck route
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      });
    });
  }

  async connectDatabase() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  async connectRedis() {
    try {
      await RedisClient.connect();
    } catch (error) {
      console.error('Redis connection error:', error);
      process.exit(1);
    }
  }

  startWebSocketServer() {
    this.wsServer = new WebSocketServer(this.httpServer);
  }

  start() {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    
    this.httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      this.startWebSocketServer();
    });
  }
}

// Export and start the server
const server = new ChatServer();
server.start();

export default server;