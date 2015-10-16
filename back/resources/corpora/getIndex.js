var Q = require('q');
var filter = require('filter-files');
var filename = require('filename-regex');
var fs = require('fs');

exports.getIndex = function (resourceManager) {
    return Q()
        .then(resourceManager.action('corpora'))
        .then(function (corpora) {
            return {corpora : corpora};
        });
};

exports.post = function (workloadManager, matrixWorkload) {
    var id = workloadManager.id(matrixWorkload);
    var result = workloadManager.retrieve(id);
    if (result) {
        result.resolved = true;
        result.requestId = id;
        return result;
    } else if (typeof result === 'undefined') {
        workloadManager.enqueue(matrixWorkload);
        return {requestId: id};
    } else {
        return {requestId: id};
    }
};

exports.postRequest = function (params, workloadManager) {
    var result = workloadManager.retrieve(params.requestId);
    if (result) {
        //console.log(result);
        return result;
    } else {
        return {progress: workloadManager.progress(params.requestId)};
    }
};

exports.postImages = function (params) {

    var list = filter.sync('front/misc/data', function (x) {
        return new RegExp(params.regex).test(x);
    }).map(function (x) {
        var match = x.match(filename());
        return match[0];
    });
    return {'files': list};
};

exports.postResultlists = function (params, resourceManager) {

    var resultlists = {};
    var req = params.request;
    var regex = req.wordCount + "_" +
        req.metric + "_" +
        "(("  + req.corpora[0].name + "_" + req.corpora[1].name +
        ")|(" + req.corpora[1].name + "_" + req.corpora[0].name + ")){1}\\.txt$";
    var listDefs = [
        {
            'name' : 'oneList',
            'use' : oneListAdapter,
            'regex' : "list([1,2]){1}_" + regex
        },
        {
            'name' : 'bothLists',
            'use' : bothListsAdapter,
            'regex' : "both_lists_" + regex
        }
    ];

    return Q().then(resourceManager.action('wordList', req))
        .then(function (wordlists) {
            var taggedWords = wordlists.reduce(function (a, b) {
                return a.concat(b.list);
            }, []);
            listDefs.forEach(function (listDef) {
                getResultList(listDef, taggedWords);
            });
            return {'resultlists': resultlists};
        });

    function getResultList (listDef, taggedWords) {
        var regex = new RegExp(listDef.regex);
        var fileDefs = filter.sync('front/misc/data', function (x) {
            return regex.test(x);
        }).map(function (file) {
            var match = file.match(filename());
            file = regex.exec(file);
            var swap, corpus;
            if (file.length === 5 ) {
                swap = typeof file[3] === 'undefined';
                corpus = req.corpora[ swap ? (file[1] == "1" ? 1 : 0 ) : (file[1] == "1" ? 0 : 1 )];
            } else {
                swap = typeof file[2] === 'undefined';
                corpus = null;
            }
            return {
                file : match[0],
                swapCorpora : swap,
                corpus : corpus
            };
        });

        fileDefs.forEach(function (fileDef) {
            var wordLists = [];
            var file = fs.readFileSync('front/misc/data/' + fileDef.file, {encoding: 'utf-8'});
            // execute list adapter
            file.split('\n').forEach(listDef.use.bind(null, wordLists));
            // enrich words with POS tags
            wordLists = wordLists.map(function (wordList) {
               return wordList.map(function (word) {
                   var tmp = taggedWords.filter(function (w) {
                       return w.word === word.word;
                   })[0];
                   word.pos = tmp && tmp.pos ? tmp.pos : 'X';
                   return word;
               });
            });
            // enrich wordlists with information
            var result = wordLists.map(function (wordList) {
                return {
                    'name' : fileDef.file,
                    'type' : listDef.name,
                    'corpora' : fileDef.swapCorpora ? req.corpora.slice().reverse() : req.corpora,
                    'corpus' : fileDef.corpus,
                    'list' : wordList
                };
            });
            // append to resultlist
            resultlists[listDef.name] = (resultlists[listDef.name] && resultlists[listDef.name].length)
                ? resultlists[listDef.name].concat(result) : result;
        });
    }

    function bothListsAdapter (words, l, i) {
        if (!Array.isArray(words[0])) {
            words[0] = [];
            words[1] = [];
        }
        if (i > 1 && l.trim()) {
            var data = l.split('\t');
            words[(parseFloat(data[1]) < parseFloat(data[2]))+0].push({
                'word': data[0],
                'freq1': parseFloat(data[1]),
                'freq2': parseFloat(data[2]),
                'logRatioNormalized' : parseFloat(data[3])
            });
        }
    }

    function oneListAdapter (words, l, i) {
        if (!Array.isArray(words[0]))
            words[0] = [];
        if (i > 1 && l.trim()) {
            var data = l.split('\t');
            words[0].push({
                'word': data[0],
                'freq': parseFloat(data[1])
            });
        }
    }
};