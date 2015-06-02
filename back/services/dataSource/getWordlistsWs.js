var Q = require('q');

var globalWordlists = [];

exports.getWordlistsWs = function (params, tunnel, corporaSchemesWs, qRequest) {
    return (function () {
        return tunnel.qConnect()
            .then(function () {
                console.log('Connecting to Webservice...');
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
                        corporaSchemesWs.filter(function (val) {
                            return regexp.test(val);
                        })
                            .sort().reverse()
                            .forEach(function (dbName) {
                                var match = /_([0-9]{3})K$/.exec(dbName);
                                if (match instanceof Array && parseInt(match[1]) * 1000 > parseInt(params.wordCount)) {
                                    minimalCorpus = dbName;
                                }
                            });
                        var url = 'http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice/wordlist/' + minimalCorpus + '/wordlisttext?limit=' + params.wordCount;
                        Q().then(qRequest.bind(null, url))
                            .then(function (response) {
                                var lines = response.split('\n');
                                var wordlist = [];
                                lines.forEach(function (line) {
                                    var data = line.split('\t');
                                    wordlist.push({word: data[1], freq: data[2]});
                                });
                                console.log('Retrieved wordlists from "' + minimalCorpus + '"...');
                                globalWordlists.push({id: corpus, count: params.wordCount, list: wordlist});
                                wordlist.corpus = corpus;
                                wordlists.push(wordlist);
                                if (wordlists.length === params.corpora.length) {
                                    deferred.resolve(wordlists);
                                }
                                wordlistRetrieved.resolve();
                            })
                            .fail(function (error) {
                                console.log(error);
                                deferred.reject(error);
                                wordlistRetrieved.resolve();
                            });

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