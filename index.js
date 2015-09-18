/**

This Node.js application offers a dynamic preview of an Atlas repository.
You can use it to view your HTML while not connected to Atlas.

**/


// node libraries
var fs = require('fs');
var path = require('path');

// npm libraries
var express = require('express');
var swig = require('swig');

// local libraries
// toc is a function that renders Table of Contents as an HTML snippet
var toc = require('./toc');

var app = express();
var outerTemplate = swig.compileFile(path.resolve(__dirname, 'theme/html/layout.html'), {autoescape: false});
var publication = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'atlas.json')).toString('utf-8'));

// Render the Table of Contents as an HTML snippet
// replace the {{ title }} parts by rendering it as a template
var tocTpl = swig.compile(toc());
var tocSnippet = tocTpl({ title : publication.title });

// Creates necessary context for rendering outer template
var outerContext = function() {
    return {
        'doctype' : '<!DOCTYPE html>',
        'title' : publication.title,
        'header' : '<link rel="stylesheet" type="text/css" media="screen" href="theme/html/html.css"/><link rel="stylesheet" type="text/css" media="print" href="theme/pdf/pdf_print.css"/>',
        'toc_link' : '<a href="toc.html">Contents</a>',
    };
};

 
// Necessary context for rendering page inner HTML
var innerContext = {
    'locals' : { toc : tocSnippet, 'title' : publication.title },
    'autoescape' : false,
};

var renderHTMLFragment = function(htmlPath, index) {
    var data = fs.readFileSync(htmlPath)
    // The content is the data we read from the HTML file
    // We need to process it as a template too, to fill in
    // tags like {{ toc }}
    var innerTemplate = data.toString('utf8');
    // Finally, render the fragment
    return swig.render(innerTemplate, innerContext);
}

app.get('/', function(req, res, next) {
    // Homepage redirects to first page of publication
    if (!publication.files || !publication.files instanceof Array || publication.files.length === 0) {
        next();
        return;
    }
    firstPage = publication.files[0];
    res.redirect('/' + firstPage);
});

app.get('/:fileslug.html', function (req, res, next) {
    // Render a page of the publication
    // This route matches one of the files described in `atlas.json`
    var index = publication.files.indexOf(req.params.fileslug + '.html');
    if (index === -1) {
        next();
        return;
    }
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
    // Start a new context: this will hold the variables
    // needed to render the general template.
    var c = outerContext();
    c.prev_link = prevSlug ? '<a href="' + prevSlug + '">Previous</a>' : '';
    c.next_link = nextSlug ? '<a href="' + nextSlug + '">Next</a>' : '';

    var htmlPath = path.resolve(__dirname, req.params.fileslug + '.html');
    var htmlFragment = renderHTMLFragment(htmlPath, index);
    c.content = htmlFragment;
    var renderedHTML = outerTemplate(c);
    res.set('Content-Type', 'text/html');
    res.send(renderedHTML);
});

app.get('/everything', function(req, res, next){
    // All the pages in one page, useful for printing
    var htmlFragments = publication.files.map(function(fileName, index, array) {
        var htmlPath = path.resolve(__dirname, fileName);
        return renderHTMLFragment(htmlPath, index);
    });
    var innerHTML = htmlFragments.join('');

    var c = outerContext();
    c.content = innerHTML;
    var renderedHTML = outerTemplate(c);

    res.set('Content-Type', 'text/html');
    res.send(renderedHTML);
});

app.use(express.static(__dirname));

app.use(function(req, res, next){
    // If none of the routes matched we will 404
    res.status(404).send('Sorry can not find that!');
});

var server = app.listen(27846, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('HTML output preview available at http://%s:%s', host, port);

});
