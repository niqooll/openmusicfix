// openmusic_consumer/src/Listener.js

class Listener {
  constructor(playlistsService, mailService) {
    this._playlistsService = playlistsService;
    this._mailService = mailService;
    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      const playlists = await this._playlistsService.getPlaylists(playlistId);
      const result = await this._mailService.sendEmail(targetEmail, JSON.stringify(playlists));

      console.log(result);
    } catch (error) {
      console.error(`Export failed: ${error.message}`);
    }
  }
}

module.exports = Listener;