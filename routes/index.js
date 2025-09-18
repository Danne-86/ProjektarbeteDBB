const express = require('express');
const router = express.Router();
const db = require('better-sqlite3')('database.db');

/* GET home page. */
router.get('/', function (req, res, next) {
  const posts = db.prepare(`
        SELECT p.*, u.avatar 
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
    `).all();

  res.render('index', {
    title: 'Inkflow',
    posts
  });
});

module.exports = router;