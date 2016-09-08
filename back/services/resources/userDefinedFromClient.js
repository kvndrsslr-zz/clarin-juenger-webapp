var Q = require('q');
/**
 * Global Cache for running application. Stores data to minimize number of necessary requests.
 * @todo implement cache flushing every X hours
 * @todo maybe make cache an own module?
 * @type {{corpora: Array, wordList: Array, wordFrequency: {}}}
 */
var cache;
var cacheRefreshInterval = 4 * 60 * 60 * 1000; //ms
var cacheRefresh = function () {
    cache = {
        'corpora' : [],
        'wordList' : [],
        'wordFrequency' : {}
    };
};
cacheRefresh();
setInterval(cacheRefresh, cacheRefreshInterval);

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
exports.userDefinedFromClient = function (qRequest, injectObjectToString, deep) {

    var resource =
        /*
         Use this interface for new resource adapters
         */
    {
        'id': 'userDefinedFromClient',
        'name': 'User-Defined Corpora',
        'action' : {
            'corpora' : corpora,
            'wordList' : wordList,
            'wordFrequency' : wordFrequency
        }
    };

    return resource;

    /**
     * Return an array of corpora objects
     * @returns {Array}
     */
    function corpora () {
        return [];
    }

    /**
     * Return the wordLists as specified by request params
     */
    function wordList (params) {
        var wordlists = [];
        //var deferred = Q.defer();
        var queryQ = Q();
        var requested = !params.missingLinks ? params.corpora : params.missingLinks
            .reduce(function (a, b) { return a.concat(b); }, [])
            .sort(function (a, b) { return a.name > b.name })
            .reduce(function (a, b) { return a.name === b.name ? a : a.concat([b]); }, []);

        return Q()
            .then(requested.forEach.bind(params.corpora, function (corpus) {
                if (corpus.resourceId === resource.id)
                    queryQ = queryQ.then(getWordlist.bind(null, corpus));
            }))
            .then(function () {
                return queryQ
                    .then(function () { console.log("Resource retrieval finished.") })
                    .then(function () { return wordlists; });
            });

        function getWordlist (corpus) {
            var wordlistRetrieved = Q.defer();
            var cached = cache.wordList.filter(function(l) {
                return l.name === corpus.name && parseFloat(l.size) >= parseFloat(params.wordCount);
            });
            if (cached.length) {
                cached = cached[0];
                cached.words = cached.words.slice(0, params.wordCount);
                cached.size = params.wordCount;
                wordlists.push(cached);
                console.log('Got cached wordlist for "' + corpus.displayName + '"!');
                wordlistRetrieved.resolve();
            } else {
                Q().then(function () {
                    var wordListTask = {
                        'name' : corpus.name,
                        'displayName' : corpus.displayName,
                        'displayDescription' :corpus.displayDescription,
                        'description' : corpus.description,
                        'date' : corpus.date,
                        'genre' : corpus.genre,
                        'resourceId' : corpus.resourceId,
                        'size' : params.wordCount,
                        'words' : corpus.words.slice(0, params.wordCount)
                    };
                    cache.wordList.push(wordListTask);
                    wordlists.push(wordListTask);
                    console.log('Retrieved wordlists from "' + corpus.name + '"...');
                    wordlistRetrieved.resolve();
                });
            }
            return wordlistRetrieved.promise;
        }
    }

    /**
     * Return the wordFrequencies as specified by request params
     */
    function wordFrequency (params) {
    }
};
