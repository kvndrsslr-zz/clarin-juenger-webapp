var Q = require('q');
var filter = require('filter-files');
var filename = require('filename-regex');
var fs = require('fs');



exports.getIndex = function (resourceManager) {
    return Q()
        .then(resourceManager.action('corpora'))
        .then(function (corpora) { 
            var language = [];
            var genre = [];
            var corporä = [];
            var minYear = 9999, maxYear = 0;
            corpora.forEach(function (c) { 
                var n = c.name;
                var sn = c.displayName;
                var y = parseInt(n.substring(n.lastIndexOf('_')+1));
                n = n.substring(0, n.lastIndexOf('_'));
                sn = sn.substring(0, sn.lastIndexOf(' '));
                //console.log(sn);
                if (y < minYear && y > 999)
                    minYear = y;
                if (y > maxYear)
                    maxYear = y;
                if (corporä.filter(function (corpys) {return corpys === n}).length === 0 /*&& y < 2000 && y > 999*/)
                    corporä.push(n); 
            });
            return {
                corpora : corporä.map(function (c) { //console.log(c);
                    var d = corpora.filter(function (d) { /*console.log( d.name);*/  return d.name.indexOf(c) !== -1})[0];
                    if( language.indexOf(d.name.substring(0, 3))  == -1 ){
                        language.push( d.name.substring(0, 3));
                    }
                    if( genre.indexOf(d.genre) == -1){
                        genre.push(d.genre);
                    }

                    return {
                        'name' : c,
                        'displayName' : d.name.substring(d.name.indexOf("_")+1,d.name.lastIndexOf("_")),
                        'shortname' : d.displayName,
                        'description' : d.description,
                        'genre' : d.genre,
                        'resourceId' : d.resourceId,
                        'language' : d.name.substring(0, 3),
                        'date' : d.date,
                        'datetype' : (d.dateraw.length==4) ? 'year':'week'
                    }
                }),
                languages : language.map(function(c){
                    return {
                        'language' : c
                    }
                }),
                genres : genre.map(function(g){
                    return{
                        'genre' : g
                    }
                }),
                minYear : minYear,
                maxYear : maxYear};
        })
    .then(function (language) { return language;

    })
 };


exports.post = function (resourceManager, params) {
    return Q().then(resourceManager.action('wordFrequency', params));
};