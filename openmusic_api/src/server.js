require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const config = require('./utils/config');

// --- Exceptions ---
const ClientError = require('./exceptions/ClientError');

// --- Albums (v1) ---
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// --- Songs (v1) ---
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// --- Users (v2) ---
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// --- Authentications (v2) ---
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// --- Playlists (v2) ---
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// --- Collaborations (v2 Opsional) ---
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// --- Exports (v3) ---
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// --- Uploads (v3) ---
const uploads = require('./api/uploads');
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// --- Cache Service (v3) ---
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  // --- Inisialisasi Services ---
  const cacheService = new CacheService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const albumsService = new AlbumsService(cacheService);
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const storageService = new StorageService();

  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // --- Penanganan Error (onPreResponse) ---
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      if (!response.isServer) {
        return h.continue;
      }
      const newResponse = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      newResponse.code(500);
      console.error(response);
      return newResponse;
    }
    return h.continue;
  });

  // --- Registrasi Plugin Eksternal & Strategi Autentikasi JWT ---
  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.jwt.accessTokenKey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.jwt.accessTokenAge,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  // --- Registrasi Semua Plugin Internal ---
  await server.register([
    {
      plugin: albums,
      options: { service: albumsService, validator: AlbumsValidator },
    },
    {
      plugin: songs,
      options: { service: songsService, validator: SongsValidator },
    },
    {
      plugin: users,
      options: { service: usersService, validator: UsersValidator },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        producerService: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
    {
      plugin: uploads,
      options: {
        storageService,
        albumsService,
        validator: UploadsValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});



// Handler debug khusus
const debugUploadHandler = (request, h) => {
  console.log('=== DEBUG POSTMAN REQUEST ===');
  console.log('Method:', request.method);
  console.log('Path:', request.path);
  console.log('Headers:', request.headers);
  console.log('Payload keys:', Object.keys(request.payload || {}));
  
  if (request.payload && request.payload.cover) {
    const cover = request.payload.cover;
    console.log('Cover type:', typeof cover);
    console.log('Cover keys:', Object.keys(cover));
    
    if (cover.hapi) {
      console.log('Cover hapi keys:', Object.keys(cover.hapi));
      console.log('Cover hapi headers:', cover.hapi.headers);
      console.log('Cover hapi filename:', cover.hapi.filename);
    } else {
      console.log('Cover hapi: NOT EXISTS');
    }
  }
  
  return {
    status: 'debug',
    message: 'Check console for debug info',
    requestHeaders: request.headers,
    payloadKeys: Object.keys(request.payload || {}),
  };
};

// Tambahkan route debug ini ke server Anda
const debugRoute = {
  method: 'POST',
  path: '/debug/upload/{id}',
  handler: debugUploadHandler,
  options: {
    payload: {
      allow: 'multipart/form-data',
      multipart: true,
      output: 'stream',
      maxBytes: 512000,
    },
  },
};

init();