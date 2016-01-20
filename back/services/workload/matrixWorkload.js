/**
 * Get the results of pairwise worlist comparisons as similiarity matrix,
 * also serves extended statistics if requested.
 * Makes use of the listdif.jar command line tool.
 */

var csv = require('fast-csv');
var Q = require('q');
var fs = require('fs');


exports.matrixWorkload = function (params, resourceManager, writeWordlists, spawnListdif, clustering) {

    function resultFile (a, b) {
        return 'front/misc/data/result_' + params.wordCount + '_' + params.metric + '_' + a.name + '_' + b.name + '.json';
    }

    var matrixWorkload = function () {
        var workloadContext = Q.defer();
        Q()
            // Step 0: Utilize Cached files
            .then(function () {
                if (isCached()) {
                    console.log("Nothing to do, all result files present!");
                } else {
                    // Step 1: fetch data from MySQL over ssh tunnel
                    // Step 2: write data to files
                    // Step 3: pairwise compare files using listdif.jar
                    console.log("Got " + params.missingLinks.length + " missing results, resolving...");
                    return Q().then(resourceManager.action('wordList', params)).then(writeWordlists).then(spawnListdif);
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
                        var f = fs.existsSync(resultFile(corpusA, corpusB)) ? resultFile(corpusA, corpusB) : resultFile(corpusB, corpusA);
                            distances.push([corpusA.name, corpusB.name, 1.0-parseFloat(fs.readFileSync(f + ".sim", {encoding: 'utf-8'}))]);
                    });
                }
                return distances;
            })
            // Step 5: calculate clusters
            .then(function (distances) {
                console.log('Calculating clusters...');
                console.log('Finished.');
                workloadContext.resolve(clustering(params.corpora.map(function (c) {return c.name;}), distances, params.clusterDepth));
                //return clustering(params.corpora, distances, params.clusterDepth);
            })
            .fail(function (err) {
                if (err) {
                    console.log(err);
                    console.log(err.stack);
                    workloadContext.reject({failure: true, error: err});
                    //return {failure: true, error: err};
                }
            });
        return workloadContext.promise;
    };

    matrixWorkload.isCached = isCached;
    matrixWorkload.id = params.corpora.map(function (c) {return c.name}).sort().toString() + ":|" + params.metric + "|:" + params.wordCount.toString();
    params.workload = matrixWorkload;
    return matrixWorkload;

    function isCached () {
        console.log('Trying to find cached results...');
        var corpora = params.corpora.slice();
        params.missingLinks = [];
        for (var i = corpora.length - 1; i >= 0; i--) {
            var corpusA = corpora.splice(i, 1)[0];
            corpora.forEach(function (corpusB) {
                if (!fs.existsSync(resultFile(corpusA, corpusB)) && !fs.existsSync(resultFile(corpusB, corpusA))) {
                    params.missingLinks.push([corpusA, corpusB]);
                    console.log(corpusA);
                }
            });
        }
        return params.missingLinks.length === 0;
    }
};
