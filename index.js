var fs = require('fs');
var path = require('path');

var express = require('express');
var swig = require('swig');

var app = express();
var outerTemplate = swig.compileFile(path.resolve(__dirname, 'theme/html/layout.html'), {autoescape: false});
var publication = JSON.parse(fs.readFileSync('atlas.json').toString('utf-8'));

// Render the Table of Contents as an HTML snippet
var tocTpl = swig.compileFile(path.resolve(__dirname, 'theme/html/partials/toc.html'), {autoescape: false});
var tocSnippet = tocTpl({ publication : publication.files });

// Will create the necessary context for laying out the recurring parts of the layout
var outerContext = function() {
    return {
        'doctype' : '<!DOCTYPE html>',
        'title' : publication.title,
        'header' : '<link rel="stylesheet" type="text/css" href="theme/html/html.css"/>',
        'toc_link' : '<a href="03-toc.html">Contents</a>',
    };
};

// This is the context necessary to render the HTML content itself
var innerContext = {
    'locals' : { toc : tocSnippet, 'title' : publication.title },
    'autoescape' : false,
};

app.get('/', function(req, res, next) {
    if (!publication.files || !publication.files instanceof Array || publication.files.length === 0) {
        next();
        return;
    }
    firstPage = publication.files[0];
    res.redirect('/' + firstPage);
});

app.get('/:fileslug.html', function (req, res, next) {
    // This route matches one of the files described in `atlas.json`
    var index = publication.files.indexOf(req.params.fileslug + '.html');
    if (index === -1) {
        next();
        return;
    }

    var htmlPath = path.resolve(req.params.fileslug + '.html');
    fs.readFile(htmlPath, function (err, data) {
        if (err) throw err;
        // Start a new context: this will hold the variables
        // needed to render the general template.
        var c = outerContext();
        // Because the atlas.json tells us the order if files,
        // We find out where in the publication we are and
        // then determine previous and next links
        var prevSlug = null, nextSlug = null;
        if (index !== 0) {
            prevSlug = publication.files[index - 1];
        }
        if (index !== publication.files.length -1) {
            nextSlug = publication.files[index + 1];
        }
        c.prev_link = prevSlug ? '<a href="' + prevSlug + '">Previous</a>' : '';
        c.next_link = nextSlug ? '<a href="' + nextSlug + '">Next</a>' : '';
        // The content is the data we read from the HTML file
        // We need to process it as a template too, to fill in
        // tags like {{ toc }}
        var innerTemplate = data.toString('utf8');
        c.content = swig.render(innerTemplate, innerContext);
        // Finally, render the entire page and send it to client
        res.set('Content-Type', 'text/html');
        res.send(outerTemplate(c));
    });
});

app.use(express.static(__dirname));

app.use(function(req, res, next){
    res.status(404).send('Sorry can not find that!');
});

var server = app.listen(27846, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('HTML output preview available at http://%s:%s', host, port);

});
