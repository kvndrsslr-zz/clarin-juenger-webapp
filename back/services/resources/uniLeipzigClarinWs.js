var Q = require('q');
//@todo: Never use params as inter-application glue. params need to be only used at starting points of incoming requests!
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
exports.uniLeipzigClarinWs = function (qRequest, injectObjectToString, deep) {

    var baseUrl = 'http://clarintest.informatik.uni-leipzig.de:8080/wordlistwebservice/wordlist';
    var resource =
        /*
         Use this interface for new resource adapters
         */
    {
        'id': 'uniLeipzigClarinWs',
        'name': 'Clarin Wordlist Webservice @ Uni Leipzig',
        'url' : {
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

    return resource;

    /**
     * Return an array of corpora objects
     * @returns {Array}
     */
    function corpora () {
        return cache.corpora.length ? cache.corpora : Q()
            .then(qRequest.bind(null, resource.url.corpora))
            .then(function (response) {
                var lines = response.split('\n');
                lines.forEach(function (line) {
                    var fields = line.split('\t');
                    if (fields.length > 4) {
                        cache.corpora.push(
                            /*
                             Use this interface for corporas when writing further resource adapters
                             */
                            {
                                'name': fields[0].trim(),
                                'displayName': fields[1].trim(),
                                'description': fields[2].trim(),
                                'date': new Date(Date.parse(fields[3].trim())),
                                'dateraw' : fields[3].trim(),
                                'genre': fields[4].trim(),
                                'resourceId': resource.id,
                                'language': fields[0].trim().substring(0,3)
                            });
                    }
                });
                return cache.corpora;
            });
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
                //  Compatibility fix for old frontend
                //  @todo remove this
                if (typeof corpus === 'string') {
                    corpus = {
                        'name' : corpus,
                        'displayName' : corpus,
                        'description' : '',
                        'date' : '',
                        'genre' : '',
                        'resourceId' : resource.id
                    };
                }
                if (corpus.resourceId === resource.id)
                    queryQ = queryQ.then(getWordlist.bind(null, corpus));
            }))
            .then(function () {
                return queryQ
                    .then(function () {console.log("Resource retrieval finished.")})
                    .then(function () { return wordlists;});
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
                Q()
                    .then(qRequest.bind(null,
                        injectObjectToString(resource.url.wordList, {
                            'corpusId' : corpus.name, 'wordCount' : params.wordCount
                        })))
                    .then(function (response) {
                        var wordList = [];
                        if (response.indexOf('<html>') !== 0) {
                            var lines = response.split('\n');
                            var rank = 1;
                            lines.forEach(function (line) {
                                var data = line.split('\t');
                                if (data.length > 2) {
                                    wordList.push({
                                        wId: data[0],
                                        word: data[1],
                                        absFreq: data[2],
                                        pos: data[3] == "" ? "X" : data[3],
                                        rank: rank
                                    });
                                }
                                rank++;
                            });
                        } else {
                            wordList = [];
                        }
                        var wordListTask = {
                            'name' : corpus.name,
                            'displayName' : corpus.displayName,
                            'description' : corpus.description,
                            'date' : corpus.date,
                            'genre' : corpus.genre,
                            'resourceId' : corpus.resourceId,
                            'size' : params.wordCount,
                            'words' : wordList
                        };
                        cache.wordList.push(wordListTask);
                        wordlists.push(wordListTask);
                        console.log('Retrieved wordlists from "' + corpus.name + '"...');
                        wordlistRetrieved.resolve();
                    })
                    .fail(function (error) {
                        console.log(error);
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
        var words = [];
        var queryQ = Q();
        //console.log('entering wf');
        //console.log(JSON.stringify(params));
        return Q()
            .then(params.corpora.forEach.bind(params.corpora, function (corpus) {
                //console.log('entering corpora loop');
                if (corpus.resourceId === resource.id)
                params.words.forEach(function (word) {
                    //console.log('entering words loop');
                    for (var year = params.minYear; year <= params.maxYear; year++) { 
                        queryQ = queryQ.then(getWordFrequency.bind(null, corpus, year, word,corpus.dateraw));
                    }
                });
            }))
            .then(function () {
                return queryQ
                    .then(console.log.bind(console, "Resource retrieval finished."))
                    .then(function () { return words;});
            });

        function getWordFrequency(corpus, year, word,dateraw) {

            var wordRetrieved = Q.defer();
            var sel = [corpus.name, year, word].join(".");
            var cached = deep.get(cache.wordFrequency, sel);
            if (typeof cached !== 'undefined') {
                console.log('Got cached wordfrequency for "' + sel+ '"!');
                words.push(cached);
                wordRetrieved.resolve();
            }
            //if year isn't related to the corpus date, then create dummy reponse. This dummy is needed for continious date->data sets for d3
            else if(dateraw.length == 4 && year != dateraw){
                var w = {
                    'word' : word,
                    'corpus' : corpus,
                    'year' : year,
                    'pos' : '',
                    'freq' : {
                        total: 0,
                        relative: -1
                    	}	
                	}
                    words.push(w);
                    wordRetrieved.resolve();  
            } 
            else if(dateraw.length > 4 && dateraw.substring(0,dateraw.indexOf("-")) !=year ){
            	var w = {
                    'word' : word,
                    'corpus' : corpus,
                    'year' : year,
                    'pos' : '',
                    'freq' : {
                        total: 0,
                        relative: -1
                    	}	
                	}
                    words.push(w);
                    wordRetrieved.resolve();
            }
            else {
                Q()
                    .then(qRequest.bind(null,
                        injectObjectToString(resource.url.wordFrequency, {
                            //'corpusId' : corpus.name + '_' + year , 'word' : word
                            'corpusId' : corpus.name , 'word' : word
                        })))
                    .then(function (response) {
                        var data = response.split('\t');
                        if (data[0].indexOf('<html>') === 0) {
                            data = [word, 0, 0];
                        }
                        
                        	var w = {
                            'word' : data[0],
                            'corpus' : corpus,
                            'year' : year,
                            'pos' : data[3],
                            'freq' : {
                                total: parseFloat(data[1]),
                                relative: parseFloat(data[2])
                            	}	
                        	}
                    	;
                        deep.set(cache.wordFrequency, sel, w);
                        words.push(w);
                        //console.log(corpus)
                        console.log('Retrieved word frequency for"' + sel + '"...');
                        wordRetrieved.resolve();
                    })
                    .fail(function (error) {
                        console.log('Failed to retrieve word frequency for"' + sel + '"...');
                        console.log(error);
                        wordRetrieved.resolve();
                    });

            }
            return wordRetrieved.promise;
        }
    }
};
