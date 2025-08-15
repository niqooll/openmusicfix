# 🚀 Quick Start Guide - OpenMusic v3

Panduan cepat untuk menjalankan OpenMusic v3 submission.

## Prerequisites Cepat

Pastikan sudah ter-install:
- Node.js 16+
- PostgreSQL
- Redis
- RabbitMQ

### Install dengan Docker (Recommended)
```bash
# Start services
docker-compose up -d

# Check services
docker-compose ps
```

### Install Manual
```bash
# PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# RabbitMQ
sudo apt install rabbitmq-server
```

## Setup Cepat (5 menit)

### 1. Clone & Install
```bash
# Clone project
git clone <your-repo>
cd submission

# Quick setup (automatic)
npm run setup
```

### 2. Environment Setup
```bash
# API Environment
cp openmusic_api/.env.template openmusic_api/.env

# Consumer Environment  
cp openmusic_consumer/.env.template openmusic_consumer/.env

# Edit .env files dengan credentials Anda
```

### 3. Database Setup
```bash
# Buat database
createdb openmusic

# Run migrations
cd openmusic_api
npm run migrate up
```

### 4. Start Applications
```bash
# Terminal 1 - API Server
cd openmusic_api
npm run dev
# Server running on http://localhost:5000

# Terminal 2 - Consumer
cd openmusic_consumer  
npm run dev
# Consumer started and waiting for messages...
```

## Test Cepat

### 1. Test API Health
```bash
curl http://localhost:5000/albums
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password","fullname":"Test User"}'
```

### 3. Login & Get Token
```bash
curl -X POST http://localhost:5000/authentications \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"password"}'
```

### 4. Test Upload Cover
```bash
curl -X POST http://localhost:5000/albums/{albumId}/covers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cover=@path/to/image.jpg"
```

### 5. Test Export Playlist
```bash
curl -X POST http://localhost:5000/export/playlists/{playlistId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetEmail":"test@example.com"}'
```

## Environment Variables Penting

### API (.env)
```env
# Minimal configuration
DATABASE_URL=postgres://user:pass@localhost:5432/openmusic
ACCESS_TOKEN_KEY=your-secret-key-min-32-chars
REFRESH_TOKEN_KEY=your-refresh-secret-key-min-32-chars
RABBITMQ_SERVER=amqp://localhost
REDIS_SERVER=localhost
```

### Consumer (.env)
```env
# Minimal configuration
DATABASE_URL=postgres://user:pass@localhost:5432/openmusic
RABBITMQ_SERVER=amqp://localhost
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Troubleshooting

### Service tidak jalan?
```bash
# Check services
sudo systemctl status postgresql
sudo systemctl status redis
sudo systemctl status rabbitmq-server

# Restart if needed
sudo systemctl restart postgresql redis rabbitmq-server
```

### Database connection error?
```bash
# Check PostgreSQL
psql -h localhost -U postgres -d openmusic
```

### Redis connection error?
```bash
# Check Redis
redis-cli ping
# Should return: PONG
```

### RabbitMQ connection error?
```bash
# Check RabbitMQ
rabbitmq-diagnostics -q ping
# Check management UI: http://localhost:15672
```

## Features Testing

### ✅ Upload Album Cover
1. Create album via POST /albums
2. Upload cover via POST /albums/{id}/covers
3. Check coverUrl in GET /albums/{id}

### ✅ Like Album System
1. Like: POST /albums/{id}/likes (with auth)
2. Check count: GET /albums/{id}/likes
3. Unlike: DELETE /albums/{id}/likes (with auth)
4. Verify cache header: `X-Data-Source: cache`

### ✅ Export Playlist
1. Create playlist: POST /playlists
2. Add songs: POST /playlists/{id}/songs
3. Export: POST /export/playlists/{id}
4. Check email for attachment

## Production Deployment

### Environment
```env
NODE_ENV=production
PORT=5000
# Use production database URL
# Use production Redis/RabbitMQ
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start API
cd openmusic_api
pm2 start src/server.js --name openmusic-api

# Start Consumer
cd ../openmusic_consumer
pm2 start src/consumer.js --name openmusic-consumer

# Monitor
pm2 monit
```

## 📞 Support

Jika ada masalah:
1. Check logs: `tail -f openmusic_api/logs/*.log`
2. Check services status
3. Verify environment variables
4. Test individual components

Happy coding! 🎵