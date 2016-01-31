var spawn = require('child_process').spawn;
var Q = require('q');



exports.spawnListdif = function (params, workloadManager) {
    return (function () {
        function spawnInstance(corpusA, corpusB) {
            var deferred = Q.defer();
            var listdif = spawn('java',
                [
                    '-jar', '../../../back/listdif-1.0.jar',
                    '-j',
                    '-m', params.metric,
                    '-l', params.wordCount,
                    '-o', "result_" + params.wordCount + '_' + params.metric + '_' + corpusA + '_' + corpusB + '.json',
                    corpusA + '.json', corpusB + '.json'
                ],
                {
                    cwd: process.cwd() + '/front/misc/data/'
                });
            listdif.on('close', function (code) {
                console.log('Success: "' + corpusA + '", "' + corpusB + '"');
                deferred.resolve();
            });
            return deferred.promise;
        }


        console.log('Launching listdif.jar (' + workloadManager.id(params.workload) + ') ...');
        var corpora = params.corpora.slice();
        var chain = [Q(), Q()];
        //@todo: parallel chaining based on number of available CPUs.
        params.missingLinks.forEach(function (missing) {
            chain[0] = chain[0].then(spawnInstance.bind(null, missing[0].name, missing[1].name, params.corpora.length));
        });
        return Q.all(chain);
    });
};