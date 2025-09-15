const express = require('express');
const router = express.Router();
const db = require('better-sqlite3')('database.db');

/* GET home page. */
router.get('/', function (req, res, next) {
  const posts = db.prepare('SELECT * FROM posts').all();

  res.render('index', {
    title: 'Inkflow',
    posts
  });
});

module.exports = router;