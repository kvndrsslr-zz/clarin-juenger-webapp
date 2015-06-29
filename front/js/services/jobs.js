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
        localStorageService.set('joblist', [{"wordCount":10000,"corpora":[{"name":"deu_private-juenger_1919","displayName":"Jünger 1919","description":"Political texts by Ernst Jünger from 1919","date":"1919","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1920","displayName":"Jünger 1920","description":"Political texts by Ernst Jünger from 1920","date":"1920","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1921","displayName":"Jünger 1921","description":"Political texts by Ernst Jünger from 1921","date":"1921","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1922","displayName":"Jünger 1922","description":"Political texts by Ernst Jünger from 1922","date":"1922","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1923","displayName":"Jünger 1923","description":"Political texts by Ernst Jünger from 1923","date":"1923","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1924","displayName":"Jünger 1924","description":"Political texts by Ernst Jünger from 1924","date":"1924","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1925","displayName":"Jünger 1925","description":"Political texts by Ernst Jünger from 1925","date":"1925","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1926","displayName":"Jünger 1926","description":"Political texts by Ernst Jünger from 1926","date":"1926","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1927","displayName":"Jünger 1927","description":"Political texts by Ernst Jünger from 1927","date":"1927","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1928","displayName":"Jünger 1928","description":"Political texts by Ernst Jünger from 1928","date":"1928","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1929","displayName":"Jünger 1929","description":"Political texts by Ernst Jünger from 1929","date":"1929","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1930","displayName":"Jünger 1930","description":"Political texts by Ernst Jünger from 1930","date":"1930","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1931","displayName":"Jünger 1931","description":"Political texts by Ernst Jünger from 1931","date":"1931","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1932","displayName":"Jünger 1932","description":"Political texts by Ernst Jünger from 1932","date":"1932","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1933","displayName":"Jünger 1933","description":"Political texts by Ernst Jünger from 1933","date":"1933","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"}],"metric":3,"requestName":"Jünger '19-33","requestId":"8b5d2e477d311d091531003c7e68dd1d1fdd020d","finished":true,"new":false},{"wordCount":10000,"corpora":[{"name":"deu_private-zeitung_1919","displayName":"Zeitung 1919","description":"Newspaper texts from 1919","date":"1919","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1920","displayName":"Zeitung 1920","description":"Newspaper texts from 1920","date":"1920","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1921","displayName":"Zeitung 1921","description":"Newspaper texts from 1921","date":"1921","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1922","displayName":"Zeitung 1922","description":"Newspaper texts from 1922","date":"1922","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1923","displayName":"Zeitung 1923","description":"Newspaper texts from 1923","date":"1923","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1924","displayName":"Zeitung 1924","description":"Newspaper texts from 1924","date":"1924","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1925","displayName":"Zeitung 1925","description":"Newspaper texts from 1925","date":"1925","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1926","displayName":"Zeitung 1926","description":"Newspaper texts from 1926","date":"1926","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1927","displayName":"Zeitung 1927","description":"Newspaper texts from 1927","date":"1927","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1928","displayName":"Zeitung 1928","description":"Newspaper texts from 1928","date":"1928","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1929","displayName":"Zeitung 1929","description":"Newspaper texts from 1929","date":"1929","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1930","displayName":"Zeitung 1930","description":"Newspaper texts from 1930","date":"1930","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1931","displayName":"Zeitung 1931","description":"Newspaper texts from 1931","date":"1931","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1932","displayName":"Zeitung 1932","description":"Newspaper texts from 1932","date":"1932","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1933","displayName":"Zeitung 1933","description":"Newspaper texts from 1933","date":"1933","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"}],"metric":3,"requestName":"Zeitung '19-33","requestId":"f914dc36a2445b1dc94cb0f9441eef4c0711431e","finished":true,"new":false},{"wordCount":10000,"corpora":[{"name":"deu_private-juenger_1927","displayName":"Jünger 1927","description":"Political texts by Ernst Jünger from 1927","date":"1927","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1928","displayName":"Jünger 1928","description":"Political texts by Ernst Jünger from 1928","date":"1928","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-juenger_1929","displayName":"Jünger 1929","description":"Political texts by Ernst Jünger from 1929","date":"1929","genre":"political journalism","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1927","displayName":"Zeitung 1927","description":"Newspaper texts from 1927","date":"1927","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1928","displayName":"Zeitung 1928","description":"Newspaper texts from 1928","date":"1928","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-zeitung_1929","displayName":"Zeitung 1929","description":"Newspaper texts from 1929","date":"1929","genre":"newspaper","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-belletristik_1927","displayName":"Belletristik 1927","description":"Fiction from 1927","date":"1927","genre":"fiction","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-belletristik_1928","displayName":"Belletristik 1928","description":"Fiction from 1928","date":"1928","genre":"fiction","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-belletristik_1929","displayName":"Belletristik 1929","description":"Fiction from 1929","date":"1929","genre":"fiction","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-gebrauchsliteratur_1927","displayName":"Gebrauchsliteratur 1927","description":"Functional literature from 1927","date":"1927","genre":"functional literature","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-gebrauchsliteratur_1928","displayName":"Gebrauchsliteratur 1928","description":"Functional literature from 1928","date":"1928","genre":"functional literature","resourceId":"uniLeipzigClarinWs","language":"German"},{"name":"deu_private-gebrauchsliteratur_1929","displayName":"Gebrauchsliteratur 1929","description":"Functional literature from 1929","date":"1929","genre":"functional literature","resourceId":"uniLeipzigClarinWs","language":"German"}],"metric":3,"requestName":"Übersicht '27-29","requestId":"10407ffa2d81b2d147f21e28449d81f19c8b93a1","finished":true,"new":false}]);
        localStorageService.set('currentjob', 'abc');
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