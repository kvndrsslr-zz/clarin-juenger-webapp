var Q = require('q');
var filter = require('filter-files');
var filename = require('filename-regex');

exports.getIndex = function (corporaSchemes, corporaSchemesWs) {
    var noSuffixSchemes = [];
    var schemes = [];
    schemes = schemes.concat(corporaSchemesWs);
    schemes.forEach(function (scheme) {
        if (!/_[0-9]{3}K$/.test(scheme)) {
            noSuffixSchemes.push(scheme);
        }
    });
    return {dbs: uniq(noSuffixSchemes)};
    function uniq(a) {
        return a.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    }
};

exports.post = function (workloadManager, matrixWorkload) {
    var id = workloadManager.id();
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