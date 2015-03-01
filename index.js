var fs = require('fs');
var path = require('path');

var express = require('express');
var swig = require('swig');

var app = express();
var tpl = swig.compileFile('theme/html/layout.html', {autoescape: false});

var context = function() {
    return {
        'doctype' : '<!DOCTYPE html>',
        'title' : 'Life after the template',
        'header': '<link rel="stylesheet" type="text/css" href="theme/html/html.css"/>',
    };
};

app.get('/:fileslug.html', function (req, res, next) {
    var htmlPath = path.resolve(req.params.fileslug + '.html');
    var c = context();
        fs.readFile(htmlPath, function (err, data) {
            if (err) {
                if (err.code == 'ENOENT') {
                    // file doesn’t exist, 404
                    console.log('404');
                    next();
                } else {
                    throw err;
                }
            }
            c.content = data;
            res.set('Content-Type', 'text/html');
            res.send(tpl(c));
        });
});

app.use(express.static(__dirname));

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('HTML output preview available at http://%s:%s', host, port);

});
