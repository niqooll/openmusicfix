const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { createPool } = require('../../utils/database');
const config = require('../../utils/config');

class AlbumsService {
  constructor(cacheService) {
    this._pool = createPool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = result.rows[0];
    
    // Add coverUrl based on cover field
    if (album.cover) {
      if (album.cover.startsWith('http')) {
        // S3 URL
        album.coverUrl = album.cover;
      } else {
        // Local file
        album.coverUrl = `http://${config.app.host}:${config.app.port}/upload/images/${album.cover}`;
      }
    } else {
      album.coverUrl = null;
    }
    
    return album;
  }

  async getAlbumWithSongs(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const songsQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const albumResult = await this._pool.query(albumQuery);
    const songsResult = await this._pool.query(songsQuery);

    if (!albumResult.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = albumResult.rows[0];
    const songs = songsResult.rows;

    // Add coverUrl based on cover field
    if (album.cover) {
      if (album.cover.startsWith('http')) {
        // S3 URL
        album.coverUrl = album.cover;
      } else {
        // Local file
        album.coverUrl = `http://${config.app.host}:${config.app.port}/upload/images/${album.cover}`;
      }
    } else {
      album.coverUrl = null;
    }

    return {
      ...album,
      songs,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addAlbumCover(albumId, coverFilename) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [coverFilename, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal mengunggah sampul. Album tidak ditemukan');
    }
  }

  async likeAlbum(userId, albumId) {
    // Check if album exists
    await this.getAlbumById(albumId);

    // Check if user already liked this album
    const checkQuery = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const checkResult = await this._pool.query(checkQuery);
    if (checkResult.rows.length > 0) {
      throw new InvariantError('Album sudah disukai');
    }

    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menyukai album');
    }

    // Delete cache for this album
    await this._cacheService.delete(`album:${albumId}:likes`);
  }

  async unlikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal batal menyukai album');
    }

    // Delete cache for this album
    await this._cacheService.delete(`album:${albumId}:likes`);
  }

  async getAlbumLikes(albumId) {
    try {
      // Try to get from cache first
      const result = await this._cacheService.get(`album:${albumId}:likes`);
      if (result !== null) {
        return { likes: parseInt(result, 10), source: 'cache' };
      }
    } catch (error) {
      // If cache fails, continue to database
      console.error('Cache error:', error);
    }

    // Get from database
    const query = {
      text: 'SELECT COUNT(*) as likes FROM user_album_likes WHERE album_id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);
    const likes = parseInt(result.rows[0].likes, 10);

    // Cache the result
    try {
      await this._cacheService.set(`album:${albumId}:likes`, likes.toString(), 1800);
    } catch (error) {
      console.error('Cache set error:', error);
    }

    return { likes, source: 'database' };
  }
}

module.exports = AlbumsService;