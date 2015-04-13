var crypto = require('crypto');
var Q = require('q');
var _ = require('underscore');

var workloads = [];
var queue = Q();


exports.workloadManager = function (params) {
    // create unique request-ID
    function createId () {
        var id = crypto.createHash('sha1');
        id.update(params.corpora.sort().toString() + ":|" + params.metric + "|:" + params.wordCount.toString(), 'utf8');
        return id.digest('hex');
    }

    function enqueue (workload) {
        //console.log(params);
        var w = {id: createId(), request: _.clone(params), workload: workload, progress: "", result: false};
        if (typeof retrieve(w.id) === 'undefined') {
            var qPoint;
            workloads.push(w);
            // when all result files are cached, launch workload instantly
            if (workload.isCached()) {
                qPoint = Q().then(workload);
            } else {
                qPoint = queue = queue.then(workload);
            }
            qPoint.then(function (data) {
                w.result = data;
            });
            qPoint.progress(function (progress) {
                w.progress = progress;
            });
        }
        return w.id;
    }

    function _retrieve (id) {
        var w = workloads.filter(function (w) { return w.id === id; });
        if (w.length === 0) {
            return 0;
        } else {
            return w[0];
        }
    }

    function retrieve (id) {
        return _retrieve(id).result;
    }

    function progress (id) {
        return _retrieve(id).progress;
    }

    return {
        enqueue: enqueue,
        retrieve: retrieve,
        progress: progress,
        id: createId
    };

};


