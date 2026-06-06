const multer = require('multer');
const path = require('path');
const { HTTP_STATUS } = require('../constants');

const AVATAR_DIR = path.join(__dirname, '../../uploads/avatars');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.user.id}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb({ statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp)' }, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
