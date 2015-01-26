var Q = require('q');

exports.getIndex = function (corporaSchemes) {
    var noSuffixSchemes = [];
    corporaSchemes.forEach(function (scheme) {
        if (!/_[0-9]{3}K$/.test(scheme)) {
            noSuffixSchemes.push(scheme);
        }
    });
    return {dbs: noSuffixSchemes};
};

exports.post = function (workloadManager, matrixWorkload) {
    var id = workloadManager.id();
    var result = workloadManager.retrieve(id);
    if (result) {
        return result;
    } else if (typeof result === 'undefined') {
        workloadManager.enqueue(matrixWorkload());
        return {requestId: id};
    } else {
        return {requestId: id};
    }
};

exports.postRequest = function (params, workloadManager) {
    var result = workloadManager.retrieve(params.requestId);
    if (result) {
        return result;
    } else {
        return {progress: workloadManager.progress(params.requestId)};
    }
};