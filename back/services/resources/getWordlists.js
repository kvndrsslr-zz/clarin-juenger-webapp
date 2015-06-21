var Q = require('q');

var globalWordlists = [];

exports.getWordlists = function (params, db, tunnel, corporaSchemes) {
    return (function () {
        return tunnel.qConnect()
            .then(function () {
                console.log('Connecting to DB...');
                var wordlists = [];
                var deferred = Q.defer();
                var queryQ = Q();
                var getWordlist = function (corpus) {
                    var wordlistRetrieved = Q.defer();
                    var cache = globalWordlists.filter(function(x) {
                        return x.id === corpus && parseFloat(x.count) >= parseFloat(params.wordCount);
                    });
                    if (cache.length !== 0) {
                        cache = cache[0].list.slice(0, params.wordCount);
                        cache.corpus = corpus;
                        wordlists.push(cache);
                        console.log('Got cached wordlists for "' + corpus + '"!');
                        if (wordlists.length === params.corpora.length) {
                            deferred.resolve(wordlists);
                        }
                    } else {
                        var minimalCorpus = corpus;
                        var regexp = new RegExp('^' + corpus + '_[0-9]{3}K$');
                        corporaSchemes.filter(function (val) {
                            return regexp.test(val);
                        })
                            .sort().reverse()
                            .forEach(function (dbName) {
                                var match = /_([0-9]{3})K$/.exec(dbName);
                                if (match instanceof Array && parseInt(match[1]) * 1000 > parseInt(params.wordCount)) {
                                    minimalCorpus = dbName;
                                }
                            });
                        db.getConnection(minimalCorpus)
                            .then(function (db) {
                                Q.ninvoke(db, "query", "SELECT word, freq FROM words ORDER BY freq DESC LIMIT " + params.wordCount)
                                    .then(function (wordlist) {
                                        wordlist = wordlist[0];
                                        console.log('Retrieved wordlists from "' + minimalCorpus + '"...');
                                        globalWordlists.push({id: corpus, count: params.wordCount, list: wordlist});
                                        wordlist.corpus = corpus;
                                        wordlists.push(wordlist);
                                        if (wordlists.length === params.corpora.length) {
                                            deferred.resolve(wordlists);
                                        }
                                        wordlistRetrieved.resolve();
                                        db.release();
                                    })
                                    .fail(function (error) {
                                        console.log(error);
                                        db.release();
                                        deferred.reject(error);
                                        wordlistRetrieved.resolve();
                                    });
                            })
                            .fail(function (error) {
                                console.log(error);
                                deferred.reject(error);
                                wordlistRetrieved.resolve();
                            }
                        );
                    }
                    return wordlistRetrieved.promise;
                };
                params.corpora.forEach(function (corpus) {
                    queryQ = queryQ.then(getWordlist.bind(null, corpus));
                });
                tunnel.close();
                return deferred.promise;
            });
    });



};