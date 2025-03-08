import { Group } from '../models/Group.js';
import { Message } from '../models/Message.js';
import { PrivateChat } from '../models/PrivateChat.js';
import RedisClient from '../config/redisClient.js';

class MessageService {
  async saveGroupMessage(senderId, groupId, content) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      const message = new Message({
        content,
        sender: senderId,
        chat: groupId,
        chatType: 'Group'
      });

      await message.save();

      // Update group's last message
      group.lastMessage = message._id;
      await group.save();

      // Populate sender details
      await message.populate('sender', 'username name avatar');

      // Cache the new message
      await this.cacheNewGroupMessage(groupId, message);

      return message;
    } catch (error) {
      throw error;
    }
  }

  async savePrivateMessage(senderId, recipientId, content) {
    try {
      let privateChat = await PrivateChat.findOne({
        participants: { $all: [senderId, recipientId] }
      });

      if (!privateChat) {
        privateChat = new PrivateChat({
          participants: [senderId, recipientId]
        });
        await privateChat.save();
      }

      const message = new Message({
        content,
        sender: senderId,
        chat: privateChat._id,
        chatType: 'PrivateChat'
      });

      await message.save();

      // Update last message in private chat
      privateChat.lastMessage = message._id;
      await privateChat.save();

      // Populate sender details
      await message.populate('sender', 'username name avatar');

      // Cache the new message
      await this.cacheNewPrivateMessage(privateChat._id, message);

      return message;
    } catch (error) {
      throw error;
    }
  }

  async getGroupMessages(groupId, page = 1, limit = 50) {
    try {
      // First, try to get messages from Redis cache
      const cachedMessages = await RedisClient.getCachedGroupMessages(groupId, page, limit);
      
      if (cachedMessages && cachedMessages.length > 0) {
        return cachedMessages;
      }

      // If no cached messages, fetch from database
      const messages = await Message.find({ 
        chat: groupId, 
        chatType: 'Group' 
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username name avatar');

      // Cache fetched messages
      await RedisClient.cacheGroupMessages(groupId, messages);

      return messages;
    } catch (error) {
      throw error;
    }
  }

  async getPrivateChatMessages(chatId, page = 1, limit = 50) {
    try {
      // First, try to get messages from Redis cache
      const cachedMessages = await RedisClient.getCachedPrivateMessages(chatId, page, limit);
      
      if (cachedMessages && cachedMessages.length > 0) {
        return cachedMessages;
      }

      // If no cached messages, fetch from database
      const messages = await Message.find({ 
        chat: chatId, 
        chatType: 'PrivateChat' 
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username name avatar');

      // Cache fetched messages
      await RedisClient.cachePrivateMessages(chatId, messages);

      return messages;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to cache a new group message
  async cacheNewGroupMessage(groupId, message) {
    try {
      // Get current cached messages
      const currentCachedMessages = await RedisClient.getCachedGroupMessages(groupId) || [];
      
      // Add new message to the beginning of the cache
      currentCachedMessages.unshift(message);
      
      // Re-cache with the new message included
      await RedisClient.cacheGroupMessages(groupId, currentCachedMessages);
    } catch (error) {
      console.error('Error caching new group message:', error);
    }
  }

  // Helper method to cache a new private message
  async cacheNewPrivateMessage(chatId, message) {
    try {
      // Get current cached messages
      const currentCachedMessages = await RedisClient.getCachedPrivateMessages(chatId) || [];
      
      // Add new message to the beginning of the cache
      currentCachedMessages.unshift(message);
      
      // Re-cache with the new message included
      await RedisClient.cachePrivateMessages(chatId, currentCachedMessages);
    } catch (error) {
      console.error('Error caching new private message:', error);
    }
  }
}

export default new MessageService();