const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'deafdiomi',
  api_key: '116458243371881',
  api_secret: 'FOy419qwt4sFNM8tS_bdOh-jU3o'
});

module.exports = cloudinary; 