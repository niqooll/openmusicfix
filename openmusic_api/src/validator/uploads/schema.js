const Joi = require('joi');

// Schema yang sangat permissive untuk compatibility
const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string().required(),
}).unknown();

module.exports = { ImageHeadersSchema };