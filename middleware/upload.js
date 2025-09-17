// middleware/upload.js
const multer = require("multer");
const path = require("path");
const { post } = require("../routes");

// Avatar storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/avatars/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

// Post image storage
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/posts/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb("Error: Images only (jpeg, jpg, png, gif)");
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single("avatar");

const uploadPostImage = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).array("postImages", 5);

module.exports = { uploadAvatar, uploadPostImage };