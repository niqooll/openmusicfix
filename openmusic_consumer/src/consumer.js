require('dotenv').config();

const amqp = require('amqplib');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const MailService = require('./services/mail/MailService');
const config = require('./utils/config');

const init = async () => {
  const playlistsService = new PlaylistsService();
  const mailService = new MailService();

  const connection = await amqp.connect(config.rabbitMq.server);
  const channel = await connection.createChannel();

  await channel.assertQueue('export:playlist', {
    durable: true,
  });

  channel.consume('export:playlist', async (message) => {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      const playlist = await playlistsService.getPlaylistById(playlistId);
      const result = JSON.stringify({ playlist });

      await mailService.sendEmail(targetEmail, result);
      console.log(`Playlist ${playlistId} exported successfully to ${targetEmail}`);

      channel.ack(message);
    } catch (error) {
      console.error('Export failed:', error);
      channel.nack(message, false, false);
    }
  });

  console.log('Consumer started and waiting for messages...');
};

init().catch((error) => {
  console.error('Failed to start consumer:', error);
  process.exit(1);
});