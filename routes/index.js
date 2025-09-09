var express = require('express');
var router = express.Router();
const db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  const select = db.prepare('SELECT * FROM posts');
  const posts = select.all();
  res.render('index', { 
    title: 'Inkflow',
    posts
   });
});

module.exports = router;
