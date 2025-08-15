# OpenMusic API v3

OpenMusic API v3 adalah aplikasi back-end untuk platform musik yang mendukung fitur ekspor playlist, upload sampul album, sistem like album, dan server-side caching.

## Struktur Proyek

```
submission/
├── openmusic_api/          # API Server
└── openmusic_consumer/     # Consumer untuk processing export
```

## Fitur

### OpenMusic API
- ✅ Pengelolaan Data Album (CRUD)
- ✅ Pengelolaan Data Song (CRUD) 
- ✅ Fitur Registrasi dan Autentikasi Pengguna
- ✅ Pengelolaan Data Playlist
- ✅ Kolaborasi Playlist
- ✅ **[NEW]** Upload Sampul Album (Local Storage / S3)
- ✅ **[NEW]** Like/Unlike Album dengan Autentikasi
- ✅ **[NEW]** Ekspor Playlist via RabbitMQ
- ✅ **[NEW]** Server-Side Caching dengan Redis

### OpenMusic Consumer
- ✅ **[NEW]** Memproses request ekspor playlist
- ✅ **[NEW]** Mengirim hasil ekspor via email

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- Redis
- RabbitMQ
- SMTP Server (untuk email)
- AWS S3 (opsional, untuk upload)

## Setup

### 1. Clone dan Install Dependencies

```bash
# Clone project
git clone <repository-url>
cd submission

# Install API dependencies
cd openmusic_api
npm install

# Install Consumer dependencies  
cd ../openmusic_consumer
npm install
```

### 2. Database Setup

```bash
# Buat database PostgreSQL
createdb openmusic

# Jalankan migrations (dari folder openmusic_api)
npm run migrate up
```

### 3. Environment Variables

#### OpenMusic API (.env)
```env
# Server
HOST=localhost
PORT=5000

# Database
DATABASE_URL=postgres://username:password@localhost:5432/openmusic

# JWT
ACCESS_TOKEN_KEY=your_secret_access_token_key
REFRESH_TOKEN_KEY=your_secret_refresh_token_key
ACCESS_TOKEN_AGE=1800

# RabbitMQ
RABBITMQ_SERVER=amqp://localhost

# Redis
REDIS_SERVER=localhost

# AWS S3 (opsional)
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### OpenMusic Consumer (.env)
```env
# Database
DATABASE_URL=postgres://username:password@localhost:5432/openmusic

# RabbitMQ
RABBITMQ_SERVER=amqp://localhost

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Menjalankan Aplikasi

### Development

```bash
# Terminal 1 - Jalankan API Server
cd openmusic_api
npm run dev

# Terminal 2 - Jalankan Consumer
cd openmusic_consumer
npm run dev
```

### Production

```bash
# Terminal 1 - API Server
cd openmusic_api
npm start

# Terminal 2 - Consumer
cd openmusic_consumer
npm start
```

## API Documentation

### Endpoints Baru di v3

#### Upload Sampul Album
```http
POST /albums/{id}/covers
Content-Type: multipart/form-data

{
    "cover": <image_file>
}
```

#### Like Album
```http
POST /albums/{id}/likes
Authorization: Bearer <token>
```

#### Unlike Album  
```http
DELETE /albums/{id}/likes
Authorization: Bearer <token>
```

#### Get Album Likes Count
```http
GET /albums/{id}/likes
```
Response header: `X-Data-Source: cache` (jika dari cache)

#### Export Playlist
```http
POST /export/playlists/{playlistId}
Authorization: Bearer <token>

{
    "targetEmail": "user@example.com"
}
```

## Ketentuan Teknis

### Upload Sampul Album
- **MIME Types**: `image/*` (jpeg, png, gif, etc.)
- **Max Size**: 512KB
- **Storage**: Local filesystem atau AWS S3
- **URL Format**: `http://host:port/upload/images/{filename}`

### Like Album
- Memerlukan autentikasi JWT
- User hanya bisa like album yang sama 1 kali
- Otomatis invalidasi cache saat like/unlike

### Server-Side Caching
- **Engine**: Redis
- **TTL**: 30 menit (1800 detik)
- **Key Pattern**: `album:{albumId}:likes`
- **Header**: `X-Data-Source: cache` untuk data dari cache

### Export Playlist
- **Message Broker**: RabbitMQ
- **Queue**: `export:playlist`
- **Format Output**: JSON
- **Delivery**: Email dengan attachment

## Testing

```bash
# API Tests
cd openmusic_api
npm test

# Linting
npm run lint
npm run lint:fix
```

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Client App    │────│ OpenMusic API │────│   PostgreSQL    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼──────────┐
            │   Redis   │ │RabbitMQ│ │ AWS S3       │
            │  (Cache)  │ │(Queue) │ │ (Storage)    │
            └───────────┘ └───┬───┘ └──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ OpenMusic Consumer │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   SMTP Server     │
                    └───────────────────┘
```

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## License

ISC License - lihat file [LICENSE](LICENSE) untuk detail.