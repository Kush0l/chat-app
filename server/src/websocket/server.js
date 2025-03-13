import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import RedisClient from '../config/redisClient.js';
import MessageService from '../services/messageService.js';

class ChatWebSocketServer {
  constructor(httpServer) {
    this.wss = new WebSocketServer({ server: httpServer });
    this.clients = new Map();
    this.redisSubscriber = null;
    this.setupWebSocketServer();
    this.setupRedisSubscriber();
  }

  async setupRedisSubscriber() {
    this.redisSubscriber = RedisClient.getClient().duplicate();
    await this.redisSubscriber.connect();

    // Subscribe to group and user channels
    await this.redisSubscriber.pSubscribe('group:*', (message, channel) => {
      this.handleRedisMessage(channel, message);
    });

    await this.redisSubscriber.pSubscribe('user:*', (message, channel) => {
      this.handleRedisMessage(channel, message);
    });
  }

  handleRedisMessage(channel, message) {
    try {
      const parsedMessage = JSON.parse(message);

      // Extract channel type and ID
      const channelParts = channel.split(':');
      const channelType = channelParts[0]; // 'user' or 'group'
      const channelId = channelParts[1];   // userId or groupId

      if (channelType === 'user') {
        // For user messages, send to the specific user
        this.clients.forEach((client) => {
          if (client.userId === channelId) {
            this.sendMessage(client.ws, parsedMessage);
          }
        });
      } else if (channelType === 'group') {
        // For group messages, send to all clients in the room
        this.clients.forEach((client) => {
          if (client.rooms.has(`${channelType}:${channelId}`)) {
            this.sendMessage(client.ws, parsedMessage);
          }
        });
      }
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  }

  setupWebSocketServer() {
    this.wss.on('connection', async (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      try {
        const decoded = this.verifyToken(token);
        const userId = decoded.id;

        ws.id = uuidv4();
        this.clients.set(ws.id, {
          ws,
          userId,
          rooms: new Set(),
        });

        // Automatically add the user to their own channel
        this.clients.get(ws.id).rooms.add(`user:${userId}`);

        await this.updateUserOnlineStatus(userId, true);
        await RedisClient.publish('user:status', JSON.stringify({
          type: 'USER_ONLINE',
          userId,
        }));

        ws.on('message', async (message) => {
          try {
            const parsedMessage = JSON.parse(message.toString());
            await this.handleMessage(userId, ws, parsedMessage);
          } catch (error) {
            console.error('Error handling message:', error);
            this.sendErrorMessage(ws, 'Invalid message format');
          }
        });

        ws.on('close', async () => {
          await this.handleDisconnection(ws);
        });

        // Send cached messages for joined groups/chats
        await this.sendCachedMessagesOnConnection(userId, ws);

        this.sendMessage(ws, {
          type: 'CONNECTION_ESTABLISHED',
          userId,
        });
      } catch (error) {
        console.error('Authentication failed:', error);
        this.sendErrorMessage(ws, 'Authentication failed');
        ws.close();
      }
    });
  }

  async sendCachedMessagesOnConnection(userId, ws) {
    try {
      const groups = await Group.find({ members: userId });

      for (const group of groups) {
        const cachedMessages = await RedisClient.getCachedGroupMessages(group._id);

        if (cachedMessages && cachedMessages.length > 0) {
          this.sendMessage(ws, {
            type: 'CACHED_GROUP_MESSAGES',
            groupId: group._id,
            messages: cachedMessages,
          });
        }
      }
    } catch (error) {
      console.error('Error sending cached messages:', error);
    }
  }

  verifyToken(token) {
    if (!token) {
      throw new Error('No token provided');
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  async handleMessage(userId, ws, message) {
    try {
      switch (message.type) {
        case 'JOIN_GROUP':
          await this.handleGroupJoin(userId, ws, message.groupId);
          break;
        case 'SEND_GROUP_MESSAGE':
          await this.handleGroupMessage(userId, message);
          break;
        case 'SEND_PRIVATE_MESSAGE':
          await this.handlePrivateMessage(userId, message);
          break;
        case 'TYPING':
          await this.handleTyping(userId, message);
          break;
        default:
          this.sendErrorMessage(ws, 'Unknown message type');
      }
    } catch (error) {
      console.error('Error in handleMessage:', error);
      this.sendErrorMessage(ws, 'Failed to process message');
    }
  }

  async handleGroupJoin(userId, ws, groupId) {
    const isMember = await this.checkGroupMembership(userId, groupId);

    if (isMember) {
      const client = this.getClientByWs(ws);
      if (client) {
        client.rooms.add(`group:${groupId}`);

        // Fetch historical messages from the database
        const historicalMessages = await MessageService.getGroupMessages(groupId);

        // Send historical messages to the client
        this.sendMessage(ws, {
          type: 'HISTORICAL_MESSAGES',
          messages: historicalMessages,
        });

        // Publish join event to the group
        await RedisClient.publish(`group:${groupId}`, JSON.stringify({
          type: 'USER_JOINED',
          userId,
          groupId,
        }));
      }
    } else {
      this.sendErrorMessage(ws, 'You are not a member of this group');
    }
  }

  async handleGroupMessage(senderId, messageData) {
    const { groupId, content } = messageData;
    const message = await MessageService.saveGroupMessage(senderId, groupId, content);

    // Cache the message in Redis
    const cachedMessages = await RedisClient.getCachedGroupMessages(groupId);
    cachedMessages.push(message);
    await RedisClient.cacheGroupMessages(groupId, cachedMessages);

    await RedisClient.publish(`group:${groupId}`, JSON.stringify({
      type: 'GROUP_MESSAGE',
      message,
      senderId,
    }));
  }

  async handlePrivateMessage(senderId, messageData) {
    const { recipientUsername, content } = messageData;
    console.log(messageData);
    
    
    // Find recipient by username
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      throw new Error('Recipient not found');
    }
    
    // Get sender details for the complete message object
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error('Sender not found');
    }

    console.log(senderId);
    

    // Save the private message
    const message = await MessageService.savePrivateMessage(senderId, recipient._id, content);
    
    // Prepare complete message object with both sender and recipient details
    const completeMessage = {
      ...message.toObject(),
      sender: {
        _id: sender._id,
        username: sender.username
      },
      recipient: {
        _id: recipient._id,
        username: recipient.username
      }
    };
    
    // Create chat ID (sorted to ensure consistency)
    const chatId = [senderId, recipient._id.toString()].sort().join('_');

    // Cache private message
    const cachedMessages = await RedisClient.getCachedPrivateMessages(chatId);
    cachedMessages.push(completeMessage);
    await RedisClient.cachePrivateMessages(chatId, cachedMessages);

    // Publish to sender's channel
    await RedisClient.publish(`user:${senderId}`, JSON.stringify({
      type: 'PRIVATE_MESSAGE',
      message: completeMessage
    }));

    // Publish to recipient's channel
    await RedisClient.publish(`user:${recipient._id}`, JSON.stringify({
      type: 'PRIVATE_MESSAGE',
      message: completeMessage
    }));
  }

  async handleTyping(userId, typingData) {
    const { roomId, isTyping } = typingData;

    await RedisClient.publish(roomId, JSON.stringify({
      type: 'TYPING',
      userId,
      isTyping,
    }));
  }

  async handleDisconnection(ws) {
    const client = this.getClientByWs(ws);
    if (client) {
      this.clients.delete(ws.id);

      await this.updateUserOnlineStatus(client.userId, false);

      await RedisClient.publish('user:status', JSON.stringify({
        type: 'USER_OFFLINE',
        userId: client.userId,
      }));
    }
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { online: isOnline, lastActive: new Date() },
        { new: true }
      );
      return user;
    } catch (error) {
      console.error('Failed to update user online status:', error);
    }
  }

  async checkGroupMembership(userId, groupId) {
    try {
      const group = await Group.findById(groupId);
      return group.members.includes(userId);
    } catch (error) {
      console.error('Group membership check failed:', error);
      return false;
    }
  }

  sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendErrorMessage(ws, errorMessage) {
    this.sendMessage(ws, {
      type: 'ERROR',
      message: errorMessage,
    });
  }

  getClientByWs(ws) {
    return Array.from(this.clients.values()).find((client) => client.ws === ws);
  }
}

export default ChatWebSocketServer;