var express = require('express');
var router = express.Router();
const db = require('better-sqlite3')('database.db', {
    verbose: console.log

});


router.get('/', function (req, res, next) {

    const { content } = req.query;

    let sql = 'SELECT * FROM posts';
    let params = [];

    if (content) {
        sql += ' WHERE LOWER(content) LIKE LOWER(?)';
        params.push(`%${content}%`);
    }
    const select = db.prepare(sql);
    const posts = select.all(...params);

    res.render('search', {
        title: 'Search',
        posts: posts
    });
});

module.exports = router;
