angular.module('ir-matrix-cooc').factory('jobManager', function ($q, $http, $timeout, localStorageService) {

    var _data = false;

    function jobs () {
        return localStorageService.get('joblist') || [];
    }

    function addJob (j) {
        var list = localStorageService.get('joblist') || [];
        var exists = _.where(list, {requestId: j.requestId}).length > 0;
        if (!exists) {
            j.finished = false;
            list.push(j);
            localStorageService.set('joblist', list);
        }
        return !exists;
    }

    function initialize () {
        var list = localStorageService.get('joblist') || [];
        if (list.length !== 0) {
            list.forEach(function (j) {
                if (!j.finished) {
                    issueJob(j);
                }
            })
        }
    }

    function issueJob (j, timeout) {
        timeout = timeout || 500;
        var deferred = $q.defer();

        function tryRequest (id) {
            $http({
                method: 'post',
                url: '/api/korpora/request',
                timeout: 9999999999,
                data: {requestId: id}
            })
                .success(function (data) {
                    if (typeof data.progress !== 'undefined') {
                        $timeout(tryRequest.bind(null, id), timeout);
                    } else {
                        deferred.resolve(data);
                        _data = data;
                        markJob(j);
                    }
                })
                .error(function (data, status, header) {
                    deferred.reject(data);
                });
        }
        $http({
            method: 'post',
            url: '/api/korpora',
            timeout: 9999999999,
            data: j
        }).success(function (data) {
            j.requestId = data.requestId;
            addJob(j);
            if (data.resolved) {
                deferred.resolve(data);
                _data = data;
                markJob(j, true);
            } else {
                tryRequest(data.requestId);
            }

        }).error(function (data, status, header) {
            deferred.reject(data);
        });

        return deferred.promise;

    }

    function markJob (j, b) {
        var list = localStorageService.get('joblist') || [];
        var job = _.findWhere(list, {requestId: j.requestId});
        if (job) {
            job.finished = true;
            job.new = !b;
            localStorageService.set('joblist', list);
        }
    }

    function currentJob (j) {
        if (typeof j === "undefined") {
            var list = localStorageService.get('joblist') || [];
            if (!localStorageService.get('currentjob') && list.length > 0) {
                localStorageService.set('currentjob', list[0].requestId);
            }
        } else {
            localStorageService.set('currentjob', j.requestId);
        }
        return localStorageService.get('currentjob');
    }

    function deleteJob (j) {
        var list = localStorageService.get('joblist') || [];
        var nList = list.filter(function (job) {
            return job.requestId !== j.requestId
        });
        localStorageService.set('joblist', nList);
        if (j.requestId === currentJob()) {
            list.forEach(function (job, i, l) {
                if (i > 0 && job.requestId === j.requestId) {
                    currentJob(l[i - 1]);
                }
            });
        }
    }

    function clearJobs () {
        localStorageService.set('joblist', []);
        localStorageService.set('currentjob', '');
    }

    initialize();

    return {
        jobs: jobs,
        addJob: addJob,
        clearJobs: clearJobs,
        currentJob: currentJob,
        markJob: markJob,
        deleteJob: deleteJob,
        initialize : initialize,
        issueJob: issueJob,
        data: function () {return _data}
    };
});