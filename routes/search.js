var express = require('express');
var router = express.Router();
const db = require('better-sqlite3')('database.db', {
    verbose: console.log

});

function mapExcerpt(rows) {
  return rows.map((p) => ({
    ...p,
    excerpt: p.content || "",
  }));
}

router.get('/', function (req, res, next) {

    const { content } = req.query;

    let sql = 'SELECT p.id, p.header, p.content, p.created_at, p.hero_image, u.username FROM posts p JOIN users u ON u.id = p.user_id';
    let params = [];

    if (content) {
        sql += ' WHERE LOWER(content) LIKE LOWER(?)';
        params.push(`%${content}%`);
    }
    const select = db.prepare(sql);
    const posts = select.all(...params);

    res.render('search', {
        title: 'Search',
        posts: mapExcerpt(posts)
    });
});

module.exports = router;
