var express = require('express');
var router = express.Router();
const db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  db.all('Select title, content, post_images FROM posts', [], (err, posts) => {
    if (err) {
      return next(err);
    }
    res.render('index', {
      title: 'Inkflow',
      posts
    });
  });
});

module.exports = router;
