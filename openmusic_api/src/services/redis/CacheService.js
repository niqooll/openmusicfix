const redis = require('redis');
const config = require('../../utils/config');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });

    this._client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this._client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    this._isConnected = false;
    this._connect();
  }

  async _connect() {
    try {
      await this._client.connect();
      this._isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this._isConnected = false;
    }
  }

  async set(key, value, expirationInSecond = 1800) {
    if (!this._isConnected) return;
    try {
      await this._client.setEx(key, expirationInSecond, value);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async get(key) {
    if (!this._isConnected) return null;
    try {
      const result = await this._client.get(key);
      return result;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async delete(key) {
    if (!this._isConnected) return;
    try {
      return this._client.del(key);
    } catch (error) {
      console.error('Redis DELETE error:', error);
    }
  }
}

module.exports = CacheService;