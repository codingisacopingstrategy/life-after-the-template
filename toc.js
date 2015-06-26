var slug = require('slug');
var $ = require('cheerio');
var htmlparser = require('cheerio/node_modules/htmlparser2');
var fs = require('fs');
var path = require('path');

/***
The following part also works client-side (requires jQuery)
***/

var levels = {
    chapter: {
        levelName: "chapter",
        selectorTitle: "h1",
        nextLevel: "sect1",
    },
    sect1: {
        levelName: "sect1",
        selectorTitle: "h1",
        nextLevel: "sect2",
    },
    sect2: {
        levelName: "sect2",
        selectorTitle: "h2",
        nextLevel: "sect3",
    },
    sect3: {
        levelName: "sect3",
        selectorTitle: "h3",
        nextLevel: "sect4",
    },
    sect4: {
        levelName: "sect4",
        selectorTitle: "h4",
        nextLevel: "sect5",
    },
    sect5: {
        levelName: "sect5",
        selectorTitle: "h5",
        nextLevel: false,
    }
}

var generateToc = function(level, $el, fileName) {
    var $li = $("<li />");
    var $link = $("<a />");
    var header = $el.children(level.selectorTitle).first();
    var title = header.text();
    $link.text(title);
    var link;
    if (level.levelName === 'chapter') {
        link = fileName;
    } else {
        link = fileName + '#' + slug(title, {lower: true});
    }
    $link.attr("href", link);
    $li.append($link);
    if (level.nextLevel) {
        var $ol = $("<ol />");
        $children = $el.children("[data-type=" + level.nextLevel + "]");
        $children.each(function(i, el) {
            $ol.append(generateToc(levels[level.nextLevel], $(el), fileName));
        });
        $li.append($ol);
    }
    return $li;
};

var setIDs = function(level, $el) {
    var header = $el.children(level.selectorTitle).first();
    var title = header.text();
    var headerSlug = slug(title, {lower: true});
    header.attr('id', headerSlug);
    if (level.nextLevel) {
        $children = $el.children("[data-type=" + level.nextLevel + "]");
        $children.each(function(i, el) {
            setIDs(levels[level.nextLevel], $(el));
        });
    }
}

if (require.main === module) {
    var publication = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'atlas.json')).toString('utf-8'));
    publication.files.forEach(function (f, i) {
        var filePath = path.resolve(__dirname, f);
        var htmlString = fs.readFileSync(filePath, 'utf8');
        var $doc = $.load( '<html>' + htmlString + '</html>', {
            normalizeWhitespace: false,
            xmlMode: true,
            decodeEntities: false
        });
        var $el = $doc('html').children().first();
        if ($el.length === 0) return;
        setIDs(levels.chapter, $el);
        // we serialise with htmlparser because it allows us to set serialisation options
        fs.writeFile(filePath, htmlparser.DomUtils.getOuterHTML($el[0], { xmlMode: true}) + '\n', function(err) {
            if (err) throw err;
        });
    });
    
}


/***
The function that can be used from node.js to generate the toc
***/

module.exports = function() {
    /**
    @returns: a HTML string of a <nav> element
    */
    var $menu = $('<section><nav data-type="toc"><ol /></nav></section>');
    var $rootList = $menu.find("ol");
    var publication = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'atlas.json')).toString('utf-8'));

    publication.files.forEach(function (f) {
        var filePath = path.resolve(__dirname, f);
        var $doc = $( fs.readFileSync(filePath, 'utf8') );
        $rootList.append( generateToc(levels.chapter, $doc, f) );
    });

    return $menu.html();
}

