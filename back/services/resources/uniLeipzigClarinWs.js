var Q = require('q');

/**
 * Global Cache for running application. Stores data to minimize number of necessary requests.
 * @todo implement cache flushing every X hours
 * @todo maybe make cache an own module?
 * @type {{corpora: Array, wordList: Array, wordFrequency: {}}}
 */
var cache = {
    'corpora' : [],
    'wordList' : [],
    'wordFrequency' : {}
};

/**
 * Resource Url
 * @todo implement this as an module argument
 * @type {{base: string, corpora: string, wordList: string, wordFrequency: string}}
 */


/**
 * Provides the interface to the wordlist-webservice at:
 * @url http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice/
 * @param tunnel
 * @param qRequest
 * @param injectObjectToString
 * @returns {{corpora: corpora, wordList: wordList, wordFrequency: wordFrequency}}
 */
exports.uniLeipzigClarinWs = function (tunnel, qRequest, injectObjectToString, params, resourceManager) {

    var baseUrl = 'http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice/wordlist';
    var resource =
        /*
        Use this interface for new resource adapters
         */
    {
        'id': 'uniLeipzigClarinWs',
        'name': 'Clarin Wordlist Webservice @ Uni Leipzig',
        'url' : {
            '' : 'http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice/wordlist',
            'corpora' : baseUrl + '/availableWordlists',
            'wordList' : baseUrl + '/{{corpusId}}/wordlisttext?limit={{wordCount}}',
            'wordFrequency' : baseUrl + '/{{corpusId}}/wordfrequencytext/{{word}}'
        },
        'action' : {
            'corpora' : corpora,
            'wordList' : wordList,
            'wordFrequency' : wordFrequency
        }
    };

    console.log('Attempting to register to resourceManager (' + resource.id + ')');
    resourceManager.register(resource);

    return resource;

    /**
     * Return an array of corpora objects
     * @returns {Array}
     */
    function corpora () {
        return cache.corpora.length ? cache.corpora : Q()
            .then(qRequest.bind(null, resource.url.corpora))
            .then(function (response) {
                console.log(response);
                var lines = response.split('\n');
                lines.forEach(function (line) {
                    var fields = line.split('\t');
                    cache.corpora.push(
                        /*
                         Use this interface for corporas when writing further resource adapters
                         */
                        {
                            'name' : fields[0],
                            'displayName' : fields[1],
                            'description' : fields[2],
                            'date' : fields[3],
                            'genre' : fields[4],
                            'resourceId' : resource.id
                        });
                });
                return cache.corpora;
            });
    }

    /**
     * Return the wordLists as specified by request params
     */
    function wordList () {

        var wordlists = [];
        var deferred = Q.defer();
        var queryQ = Q();

        return tunnel
            .qConnect()
            .then(params.corpora.forEach.bind(null, function (corpus) {
                if (corpus.resourceId === resource.id)
                    queryQ = queryQ.then(getWordlist.bind(null, corpus));
            }))
            .then(deferred.promise);

        function getWordlist (corpus) {
            var wordlistRetrieved = Q.defer();
            var cached = cache.wordList.filter(function(x) {
                return x.id === corpus && parseFloat(x.count) >= parseFloat(params.wordCount);
            });
            if (cached.length) {
                cached = cached[0].list.slice(0, params.wordCount);
                cached.corpus = corpus;
                wordlists.push(cached);
                console.log('Got cached wordlist for "' + corpus + '"!');

                if (wordlists.length === params.corpora.length) {
                    deferred.resolve(wordlists);
                }
            } else {
                Q()
                    .then(qRequest.bind(null,
                        injectObjectToString(resourceUrls.wordList, {
                            'corpusId' : corpus, 'wordCount' : params.wordCount
                        })))
                    .then(function (response) {
                        var lines = response.split('\n');
                        var wordlist = [];
                        lines.forEach(function (line) {
                            var data = line.split('\t');
                            wordlist.push({word: data[1], freq: data[2]});
                        });
                        console.log('Retrieved wordlists from "' + minimalCorpus + '"...');
                        cache.wordList.push({id: corpus, count: params.wordCount, list: wordlist});
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
        }
    }

    /**
     * Return the wordFrequencies as specified by request params
     */
    function wordFrequency () {
        var words = [];
        var deferred = Q.defer();
        var queryQ = Q();

        return tunnel
            .qConnect()
            .then(params.corpora.forEach.bind(null, function (corpus) {
                params.words.forEach(function (word) {
                    for (var date = params.fromDate; date <= params.toDate; date++) {
                        queryQ = queryQ.then(getWordFrequency.bind(null, corpus, year, word));
                    }
                });
            }))
            .then(deferred.promise);

        function getWordFrequency(corpus, year, word) {
            var id = [corpus, year, word].join("-");
            var wordRetrieved = Q.defer();
            var cached = cache.wordFrequency.filter(function (c) {
                return c.id === id;
            });
            if (cached.length) {
                cached = cached[0].list.slice(0, params.wordCount);
                cached.corpus = corpus;
                words.push(cached);
                console.log('Got cached wordfrequency for "' + id+ '"!');
                if (words.length === params.corpora.length) {
                    deferred.resolve(words);
                }
            } else {
                Q()
                    .then(qRequest.bind(null,
                        injectObjectToString(resourceUrls.wordList, {
                            'corpusId' : corpus, 'wordCount' : params.wordCount
                        })))
                    .then(function (response) {
                        var lines = response.split('\n');
                        var wordlist = [];
                        lines.forEach(function (line) {
                            var data = line.split('\t');
                            wordlist.push({
                                word: data[0],
                                freq: {
                                    total: parseFloat(data[1]),
                                    relative: parseFloat(data[2])
                                }
                            });
                        });
                        console.log('Retrieved wordlists from "' + minimalCorpus + '"...');
                        cache.wordList.push({id: corpus, count: params.wordCount, list: wordlist});
                        wordlist.corpus = corpus;
                        words.push(wordlist);
                        if (words.length === params.corpora.length) {
                            deferred.resolve(words);
                        }
                        wordRetrieved.resolve();
                    })
                    .fail(function (error) {
                        console.log(error);
                        deferred.reject(error);
                        wordRetrieved.resolve();
                    });

            }
            return wordRetrieved.promise;
        }
    }
};