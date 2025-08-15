const autoBind = require('auto-bind');

class UploadsHandler {
  constructor(storageService, albumsService, validator) {
    this._storageService = storageService;
    this._albumsService = albumsService;
    this._validator = validator;

    autoBind(this);
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    const { id } = request.params;

    this._validator.validateImageHeaders(cover.hapi.headers);

    let filename;

    if (process.env.AWS_BUCKET_NAME) {
      // Use S3
      filename = await this._storageService.uploadToS3(cover, cover.hapi);
    } else {
      // Use local storage
      filename = await this._storageService.writeFile(cover, cover.hapi);
    }

    await this._albumsService.addAlbumCover(id, filename);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;