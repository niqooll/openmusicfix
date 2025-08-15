// openmusic_consumer/src/services/postgres/PlaylistService.js
const { Pool } = require('pg');
const config = require('../../utils/config');

class PlaylistsService {
  constructor() {
    this._pool = new Pool({
      connectionString: config.database.url,
    });
  }

  async getPlaylistById(playlistId) {
    const playlistQuery = {
      text: `SELECT p.id, p.name
             FROM playlists p
             WHERE p.id = $1`,
      values: [playlistId],
    };

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer
             FROM songs s
             JOIN playlist_songs ps ON s.id = ps.song_id
             WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(playlistQuery);
    const songsResult = await this._pool.query(songsQuery);

    if (!playlistResult.rows.length) {
      throw new Error('Playlist tidak ditemukan');
    }

    const playlist = playlistResult.rows[0];
    playlist.songs = songsResult.rows;

    return playlist;
  }
}

module.exports = PlaylistsService;