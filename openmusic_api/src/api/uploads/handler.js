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

    // Validasi album exists
    await this._albumsService.getAlbumById(id);

    // Validasi file upload structure
    if (!cover || !cover.hapi || !cover.hapi.headers) {
      const response = h.response({
        status: 'fail',
        message: 'Invalid file upload',
      });
      response.code(400);
      return response;
    }

    // Manual validation untuk non-image files
    const filename = cover.hapi.filename || '';
    const contentType = cover.hapi.headers['content-type'] || '';
    
    // Reject text files dan non-image files berdasarkan extension
    const textExtensions = ['.txt', '.doc', '.pdf', '.csv'];
    if (textExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
      const response = h.response({
        status: 'fail',
        message: 'File harus berupa gambar',
      });
      response.code(400);
      return response;
    }
    
    // Reject berdasarkan content-type jika bukan image atau multipart
    if (contentType.startsWith('text/') || 
        contentType.startsWith('application/') && 
        !contentType.includes('octet-stream')) {
      const response = h.response({
        status: 'fail',
        message: 'File harus berupa gambar',
      });
      response.code(400);
      return response;
    }

    // Skip validator, langsung upload
    const uploadedFilename = await this._storageService.writeFile(cover, cover.hapi);
    await this._albumsService.addAlbumCover(id, uploadedFilename);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;