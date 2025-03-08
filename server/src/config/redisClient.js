import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

class RedisClient {
  constructor() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log('Connected to Redis');
    }
  }

  async disconnect() {
    await this.client.quit();
  }

  // Caching methods for messages
  async cacheGroupMessages(groupId, messages) {
    await this.connect();
    // Convert messages to string and cache
    const serializedMessages = messages.map(msg => JSON.stringify(msg));
    
    // Cache messages with an expiration (e.g., 1 hour)
    await this.client.del(`group:messages:${groupId}`);
    if (serializedMessages.length > 0) {
      await this.client.rPush(`group:messages:${groupId}`, serializedMessages);
      await this.client.expire(`group:messages:${groupId}`, 3600); // 1 hour expiration
    }
  }

  async cachePrivateMessages(chatId, messages) {
    await this.connect();
    // Convert messages to string and cache
    const serializedMessages = messages.map(msg => JSON.stringify(msg));
    
    // Cache messages with an expiration (e.g., 1 hour)
    await this.client.del(`private:messages:${chatId}`);
    if (serializedMessages.length > 0) {
      await this.client.rPush(`private:messages:${chatId}`, serializedMessages);
      await this.client.expire(`private:messages:${chatId}`, 3600); // 1 hour expiration
    }
  }

  async getCachedGroupMessages(groupId, page = 1, limit = 50) {
    await this.connect();
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const cachedMessages = await this.client.lRange(`group:messages:${groupId}`, start, end);
    return cachedMessages.map(msg => JSON.parse(msg));
  }

  async getCachedPrivateMessages(chatId, page = 1, limit = 50) {
    await this.connect();
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const cachedMessages = await this.client.lRange(`private:messages:${chatId}`, start, end);
    return cachedMessages.map(msg => JSON.parse(msg));
  }

  // Publish and subscribe methods remain the same
  async publish(channel, message) {
    await this.connect();
    return this.client.publish(channel, message);
  }

  async subscribe(channel, callback) {
    await this.connect();
    const subscriber = this.client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, callback);
    return subscriber;
  }

  getClient() {
    return this.client;
  }
}

export default new RedisClient();