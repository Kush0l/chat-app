// import { WebSocketServer } from 'ws';
// import jwt from 'jsonwebtoken';
// import { v4 as uuidv4 } from 'uuid';
// import { User } from '../models/User.js';
// import { Group } from '../models/Group.js';
// import RedisClient from '../config/redisClient.js';
// import MessageService from '../services/messageService.js';

// class ChatWebSocketServer {
//   constructor(httpServer) {
//     this.wss = new WebSocketServer({ server: httpServer });
//     this.clients = new Map();
//     this.setupWebSocketServer();
//   }

//   setupWebSocketServer() {
//     this.wss.on('connection', async (ws, req) => {
//       const url = new URL(req.url, `http://${req.headers.host}`);
//       const token = url.searchParams.get('token');
//       try {
//         const decoded = this.verifyToken(token);
//         const userId = decoded.id;
        
//         ws.id = uuidv4();
        
//         this.clients.set(ws.id, {
//           ws,
//           userId,
//           rooms: new Set()
//         });

//         await this.updateUserOnlineStatus(userId, true);
        
//         await RedisClient.publish('user:status', JSON.stringify({
//           type: 'USER_ONLINE',
//           userId
//         }));

//         ws.on('message', async (message) => {
//           try {
//             const parsedMessage = JSON.parse(message.toString());
//             await this.handleMessage(userId, ws, parsedMessage);
//           } catch (error) {
//             this.sendErrorMessage(ws, 'Invalid message format');
//           }
//         });

//         ws.on('close', async () => {
//           await this.handleDisconnection(ws);
//         });

//         // Send cached messages for joined groups/chats
//         await this.sendCachedMessagesOnConnection(userId, ws);

//         this.sendMessage(ws, {
//           type: 'CONNECTION_ESTABLISHED',
//           userId
//         });
//       } catch (error) {
//         this.sendErrorMessage(ws, 'Authentication failed');
//         ws.close();
//       }
//     });
//   }

//   // New method to send cached messages when user connects
//   async sendCachedMessagesOnConnection(userId, ws) {
//     try {
//       // Get user's groups
//       const groups = await Group.find({ members: userId });
      
//       for (const group of groups) {
//         const cachedMessages = await RedisClient.getCachedGroupMessages(group._id);
        
//         if (cachedMessages && cachedMessages.length > 0) {
//           this.sendMessage(ws, {
//             type: 'CACHED_GROUP_MESSAGES',
//             groupId: group._id,
//             messages: cachedMessages
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Error sending cached messages:', error);
//     }
//   }
  
//   verifyToken(token) {
//     if (!token) {
//       throw new Error('No token provided');
//     }
//     return jwt.verify(token, process.env.JWT_SECRET);
//   }

//   async handleMessage(userId, ws, message) {
//     switch (message.type) {
//       // not tested
//       case 'JOIN_GROUP':
//         await this.handleGroupJoin(userId, ws, message.groupId);
//         break;
//       case 'SEND_GROUP_MESSAGE':
//         await this.handleGroupMessage(userId, message);
//         break;
//       case 'SEND_PRIVATE_MESSAGE':
//         await this.handlePrivateMessage(userId, message);
//         break;

//       // not tested
//       case 'TYPING':
//         await this.handleTyping(userId, message);
//         break;
//       default:
//         this.sendErrorMessage(ws, 'Unknown message type');
//     }
//   }

//   async handleGroupJoin(userId, ws, groupId) {
//     // Validate group membership
//     const isMember = await this.checkGroupMembership(userId, groupId);
    
//     if (isMember) {
//       const client = this.getClientByWs(ws);
//       if (client) {
//         client.rooms.add(`group:${groupId}`);
        
//         // Publish join event
//         await RedisClient.publish(`group:${groupId}`, JSON.stringify({
//           type: 'USER_JOINED',
//           userId,
//           groupId
//         }));
//       }
//     }
//   }

//   async handleGroupMessage(senderId, messageData) {
//     const { groupId, content } = messageData;

//     // Save message to database
//     const message = await MessageService.saveGroupMessage(senderId, groupId, content);

//     // Publish to group channel
//     await RedisClient.publish(`group:${groupId}`, JSON.stringify({
//       type: 'GROUP_MESSAGE',
//       message,
//       senderId
//     }));
//   }

//   async handlePrivateMessage(senderId, messageData) {
//     const { recipientId, content } = messageData;

//     // Save message to database
//     const message = await MessageService.savePrivateMessage(senderId, recipientId, content);

//     // Publish to both sender and recipient channels
//     await RedisClient.publish(`user:${senderId}`, JSON.stringify({
//       type: 'PRIVATE_MESSAGE',
//       message,
//       senderId
//     }));

//     await RedisClient.publish(`user:${recipientId}`, JSON.stringify({
//       type: 'PRIVATE_MESSAGE',
//       message,
//       senderId
//     }));
//   }

//   async handleTyping(userId, typingData) {
//     const { roomId, isTyping } = typingData;

//     // Publish typing event to room
//     await RedisClient.publish(roomId, JSON.stringify({
//       type: 'TYPING',
//       userId,
//       isTyping
//     }));
//   }


//   // not tested
//   async handleDisconnection(ws) {
//     const client = this.getClientByWs(ws);
//     if (client) {
//       // Remove client from tracking
//       this.clients.delete(ws.id);

//       // Update user's online status
//       await this.updateUserOnlineStatus(client.userId, false);

//       // Broadcast user offline status
//       await RedisClient.publish('user:status', JSON.stringify({
//         type: 'USER_OFFLINE',
//         userId: client.userId
//       }));
//     }
//   }

//   async updateUserOnlineStatus(userId, isOnline) {
//     try {
//       const user = await User.findByIdAndUpdate(userId, {
//         online: isOnline,
//         lastActive: new Date()
//       }, { new: true });

//       return user;
//     } catch (error) {
//       console.error('Failed to update user online status:', error);
//     }
//   }

//   // Utility method to check group membership
//   async checkGroupMembership(userId, groupId) {
//     try {
//       const group = await Group.findById(groupId);
//       return group.members.includes(userId);
//     } catch (error) {
//       console.error('Group membership check failed:', error);
//       return false;
//     }
//   }

//   sendMessage(ws, message) {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify(message));
//     }
//   }

//   sendErrorMessage(ws, errorMessage) {
//     this.sendMessage(ws, {
//       type: 'ERROR',
//       message: errorMessage
//     });
//   }

//   getClientByWs(ws) {
//     return Array.from(this.clients.values()).find(client => client.ws === ws);
//   }
// }

// export default ChatWebSocketServer;


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
    this.setupWebSocketServer();
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

    await RedisClient.publish(`group:${groupId}`, JSON.stringify({
      type: 'GROUP_MESSAGE',
      message,
      senderId,
    }));
  }

  async handlePrivateMessage(senderId, messageData) {
    const { recipientId, content } = messageData;

    const message = await MessageService.savePrivateMessage(senderId, recipientId, content);

    await RedisClient.publish(`user:${senderId}`, JSON.stringify({
      type: 'PRIVATE_MESSAGE',
      message,
      senderId,
    }));

    await RedisClient.publish(`user:${recipientId}`, JSON.stringify({
      type: 'PRIVATE_MESSAGE',
      message,
      senderId,
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
    if (ws.readyState === WebSocket.OPEN) {
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