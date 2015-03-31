/**
 * Get the results of pairwise worlist comparisons as similiarity matrix,
 * also serves extended statistics if requested.
 * Makes use of the listdif.jar command line tool.
 */

var csv = require('fast-csv');
var Q = require('q');
var fs = require('fs');


exports.matrixWorkload = function (params, getWordlists, writeWordlists, spawnListdif, clustering) {

    var matrixWorkload = function () {
        return Q()
            // Step 0: Utilize Cached files
            .then(function () {
                if (isCached()) {
                    console.log("Nothing to do, all result files present!");
                } else {
                    // Step 1: fetch data from MySQL over ssh tunnel
                    // Step 2: write data to files
                    // Step 3: pairwise compare files using listdif.jar
                    console.log("Got " + params.missingLinks.length + " missing results, resolving...");
                    return Q().then(getWordlists).then(writeWordlists).then(spawnListdif);
                }
            })
            // Step 4: read files, parse to json, return json object
            .then(function () {
                console.log('Parsing statistical files to JSON...');
                var distances = [];
                var corpora = params.corpora.map(function (x) {
                    return x
                });
                for (var i = corpora.length - 1; i >= 0; i--) {
                    var corpusA = corpora.splice(i, 1)[0];
                    corpora.forEach(function (corpusB) {
                        if (fs.existsSync('data/result_' + params.wordCount + '_' + params.metric + '_' + corpusA + '_' + corpusB + '.txt'))
                            distances.push([corpusA, corpusB, parseFloat(fs.readFileSync('data/result_' + params.wordCount + '_' + params.metric + '_' + corpusA + '_' + corpusB + '.txt', {encoding: 'utf-8'}))]);
                        else
                            distances.push([corpusA, corpusB, parseFloat(fs.readFileSync('data/result_' + params.wordCount + '_' + params.metric + '_' + corpusB + '_' + corpusA + '.txt', {encoding: 'utf-8'}))]);
                    });
                }
                return distances;
            })
            // Step 5: calculate clusters
            .then(function (distances) {
                console.log('Calculating clusters...');
                console.log('Finished.');
                return clustering(params.corpora, distances, params.clusterDepth);
            })
            .fail(function (err) {
                if (err) {
                    console.log(err);
                    console.log(err.stack);
                    return {failure: true, error: err};
                }
            });
    };

    matrixWorkload.isCached = isCached;
    return matrixWorkload;

    function isCached () {
        console.log('Trying to find cached results...');
        var corpora = params.corpora.slice();
        params.missingLinks = [];
        for (var i = corpora.length - 1; i >= 0; i--) {
            var corpusA = corpora.splice(i, 1)[0];
            corpora.forEach(function (corpusB) {
                if (!fs.existsSync('data/result_' + params.wordCount + '_' + params.metric + '_' + corpusA + '_' + corpusB + '.txt') &&
                    !fs.existsSync('data/result_' + params.wordCount + '_' + params.metric + '_' + corpusB + '_' + corpusA + '.txt'))
                    params.missingLinks.push([corpusA, corpusB]);
            });
        }
        return params.missingLinks.length === 0;
    }
};
