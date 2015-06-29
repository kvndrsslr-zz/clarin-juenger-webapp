var Q = require('q');
var filter = require('filter-files');
var filename = require('filename-regex');
var fs = require('fs');

exports.getIndex = function (resourceManager) {
    return Q()
        .then(resourceManager.action('corpora'))
        .then(function (corpora) {
            var corporä = [];
            var minYear = 9999, maxYear = 0;
            corpora.forEach(function (c) {
                var n = c.name;
                var y = parseInt(n.substring(n.lastIndexOf('_')+1));
                n = n.substring(0, n.lastIndexOf('_'));
                if (y < minYear && y > 999)
                    minYear = y;
                if (y > maxYear)
                    maxYear = y;
                if (corporä.filter(function (corpys) {return corpys === n}).length === 0 && y < 2000 && y > 999)
                    corporä.push(n);
            });
            return {
                corpora : corporä.map(function (c) {
                    var d = corpora.filter(function (d) {return d.name.indexOf(c) !== -1})[0];
                    return {
                        'name' : c,
                        'displayName' : d.displayName.substring(0, d.displayName.lastIndexOf(" ")),
                        'description' : d.description,
                        'genre' : d.genre,
                        'resourceId' : d.resourceId
                    }
                }),
                minYear : minYear,
                maxYear : maxYear};
        });
};

exports.post = function (resourceManager) {
    return Q().then(resourceManager.action('wordFrequency'));
};