// Kode Perbaikan
const nodemailer = require('nodemailer');
const config = require('../../utils/config');

class MailService {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: true, // true untuk port 465
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
      // TAMBAHKAN BLOK KODE INI
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  sendEmail(targetEmail, content) {
    const message = {
      from: 'OpenMusic API',
      to: targetEmail,
      subject: 'Ekspor Playlist',
      text: 'Terlampir hasil ekspor playlist',
      attachments: [
        {
          filename: 'playlists.json',
          content,
        },
      ],
    };
    return this._transporter.sendMail(message);
  }
}

module.exports = MailService;