// Kode Perbaikan
const Joi = require('joi');

const ImageHeadersSchema = Joi.object({
  // Cek apakah content-type DIAWALI dengan "image/"
  'content-type': Joi.string().pattern(/^image\//).required(),
}).unknown();

module.exports = { ImageHeadersSchema };