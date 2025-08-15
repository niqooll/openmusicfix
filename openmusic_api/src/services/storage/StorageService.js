const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const config = require('../../utils/config');

class StorageService {
  constructor() {
    this._S3 = new AWS.S3({
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
      region: config.s3.region,
    });
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const directory = path.resolve(__dirname, '../../../uploads/images');

    // Ensure uploads directory exists
    const uploadDir = path.dirname(filePath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }

  async uploadToS3(file, meta) {
    const parameter = {
      Bucket: config.s3.bucketName,
      Key: +new Date() + meta.filename,
      Body: file,
      ContentType: meta.headers['content-type'],
    };

    const result = await this._S3.upload(parameter).promise();
    return result.Location;
  }

  deleteFile(filename) {
    const filePath = path.resolve(__dirname, `../../../uploads/${filename}`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = StorageService;
