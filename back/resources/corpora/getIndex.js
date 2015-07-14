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

exports.postResultlists = function (params) {

    var listAdapter = {
        'bothLists' : bothListsAdapter,
        'oneList' : oneListAdapter
    };

    var resultlists = {};

    params.requests.forEach(getResultList);

    return {'resultlists': resultlists};


    function getResultList (request) {
        var files = filter.sync('front/misc/data', function (x) {
            return new RegExp(request.regex).exec(x);
        }).map(function (x) {
            var match = x.match(filename());
            return {
                file : match[0],
                corpora : typeof x[1] === 'undefined' ? request.corpora.reverse() : request.corpora
            };
        });
        files.forEach(function (f) {
            var file = fs.readFileSync('front/misc/data/' + f.file, {encoding: 'utf-8'});
            var lines = file.split('\n');
            var words = [];
            lines.forEach(listAdapter[request.listType].bind(null, words));
            var x = words.map(function (w) {
                return {
                    'name' : f.file,
                    'type' : request.listType,
                    'corpora' : f.corpora,
                    'list' : w
                };
            });
            resultlists[request.listType] = resultlists[request.listType] && resultlists[request.listType].length ? resultlists[request.listType].concat(x) : x;
        });
    }

    function bothListsAdapter (words, l, i) {
        if (!Array.isArray(words[0])) {
            words[0] = [];
            words[1] = [];
        }
        if (i > 1 && l.trim()) {
            var data = l.split('\t');
            words[(parseFloat(data[1]) < parseFloat(data[2])+0)].push({
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