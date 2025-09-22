var express = require("express");
var router = express.Router();
var path = require("path");

const { uploadPostImage } = require("../middleware/upload");
const { error } = require("console");
const { authenticateToken } = require("../middleware/auth");
const db = require('better-sqlite3')('database.db');

/* GET home page. */
router.get('/', function (req, res, next) {
  const posts = db.prepare(`
        SELECT p.*, u.avatar_url
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
    `).all();

  res.render('index', {
    title: 'Inkflow',
    posts
  });
});

module.exports = router;
