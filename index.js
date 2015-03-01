var fs = require('fs');
var path = require('path');

var express = require('express');
var swig = require('swig');

var app = express();
var tpl = swig.compileFile('theme/html/layout.html', {autoescape: false});
var publication = JSON.parse(fs.readFileSync('atlas.json').toString('utf-8'));


var context = function() {
    return {
        'doctype' : '<!DOCTYPE html>',
        'title' : publication.title,
        'header': '<link rel="stylesheet" type="text/css" href="theme/html/html.css"/>',
    };
};

app.get('/:fileslug.html', function (req, res, next) {
    var prevSlug = null, nextSlug = null;
    var htmlPath = path.resolve(req.params.fileslug + '.html');
    var c = context();

    var index = publication.files.indexOf(req.params.fileslug + '.html');
    if (index === -1) {
        next();
        return;
    }
    if (index !== 0) {
        prevSlug = publication.files[index - 1];
    }
    if (index !== publication.files.length -1) {
        nextSlug = publication.files[index + 1];
    }
    fs.readFile(htmlPath, function (err, data) {
        if (err) throw err;
        c.content = data;
        c.prev_link = prevSlug ? '<a href="' + prevSlug + '">Previous</a>' : '';
        c.next_link = nextSlug ? '<a href="' + nextSlug + '">Next</a>' : '';
        res.set('Content-Type', 'text/html');
        res.send(tpl(c));
    });
});

app.use(express.static(__dirname));

app.use(function(req, res, next){
    res.send(404, 'Sorry can not find that!');
});

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('HTML output preview available at http://%s:%s', host, port);

});
