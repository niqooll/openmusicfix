#!/usr/bin/env node

const { Pool } = require('pg');
const redis = require('redis');
const amqp = require('amqplib');

async function checkPostgreSQL() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/openmusic'
    });
    await pool.query('SELECT 1');
    await pool.end();
    console.log('✅ PostgreSQL: Connected');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL: Failed -', error.message);
    return false;
  }
}

async function checkRedis() {
  try {
    const client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER || 'localhost',
        port: 6379,
      },
    });
    
    await client.connect();
    await client.ping();
    await client.quit();
    console.log('✅ Redis: Connected');
    return true;
  } catch (error) {
    console.log('❌ Redis: Failed -', error.message);
    return false;
  }
}

async function checkRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER || 'amqp://localhost');
    await connection.close();
    console.log('✅ RabbitMQ: Connected');
    return true;
  } catch (error) {
    console.log('❌ RabbitMQ: Failed -', error.message);
    return false;
  }
}

async function main() {
  console.log('🏥 OpenMusic v3 Health Check');
  console.log('===============================\n');

  const results = await Promise.allSettled([
    checkPostgreSQL(),
    checkRedis(),
    checkRabbitMQ()
  ]);

  const allHealthy = results.every(result => 
    result.status === 'fulfilled' && result.value === true
  );

  console.log('\n===============================');
  if (allHealthy) {
    console.log('🎉 All services are healthy!');
    console.log('Ready to run OpenMusic v3');
    process.exit(0);
  } else {
    console.log('⚠️  Some services are not available');
    console.log('Please check the failed services above');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});