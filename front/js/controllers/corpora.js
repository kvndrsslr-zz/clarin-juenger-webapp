angular.module('ir-matrix-cooc')
    .controller('corporaController', function ($scope, $translate, $timeout, $http, data, jobManager, matrixVisualization, userCorpora, $rootScope) {
        // debug
        $scope.alert = window.alert.bind(window);
        window.scope = $scope;
        // inital controller data
        $scope.$watch(jobManager.jobs, function (newValue) {
            $scope.jobs = newValue;
        }, true);

        $scope.statsEmpty = false;

        $scope.uploadModel = {
            displayName: "",
            filetype: "plain",
            progress: 0,
            file: null,
            validation: function () {
                if ($scope.uploadModel.file === null) {
                    return $translate.instant('SEC_UPLOAD_VALIDATIONSELECTFILE');
                } else {
                    return "";
                }
            }
        };

        $scope.deleteUserCorpora = userCorpora.remove;


        $scope.upload = function () {
            if (!$scope.uploadModel.validation()) {
                userCorpora.add($scope.uploadModel);
            }
        };

        $scope.$watch(userCorpora.list, function (x) {
            $scope.userCorpora = x;
            updateCorpora();
        },1000);


        $scope.requestName = "";
        $scope.wordCount = 10000;
        $scope.sel = {
            corpora: [],
            genres: [],
            languages: [],
            metric: 3,
            colors: 'REDDISH',
            sorting: 'sortOrder',
            PosTags: '',
            wordList: 'moreSource',
            wordListType: 'BOTH',
            wordListOrigin: 'source'
        };
        $scope.genres = data.genres;
        $scope.languages = data.languages;

        console.log(data.corpora);
      //  console.log(data.genres);
      //  console.log(data.languages);

        $scope.selectWordlist = function (name) {
            $scope.sel.wordList = name;
            switch (name) {
                case 'moreSource':
                    $scope.sel.wordListType = 'BOTH';
                    $scope.sel.wordListOrigin = 'source';
                    break;
                case 'moreTarget':
                    $scope.sel.wordListType = 'BOTH';
                    $scope.sel.wordListOrigin = 'target';
                    break;
                case 'onlySource':
                    $scope.sel.wordListType = 'ONLY';
                    $scope.sel.wordListOrigin = 'source';
                    break;
                case 'onlyTarget':
                    $scope.sel.wordListType = 'ONLY';
                    $scope.sel.wordListOrigin = 'target';
                    break;
            }
        };

        function updateCorpora() {
            /*$scope.corpora = data.corpora.concat(userCorpora.list()).map(function(c) {
                if (c.name.substring(0,3) === "usr")
                    c['language'] = $translate.instant('SEC_CONFIG_USERLANGTYPE');
                else
                    c['language'] = window.languages.get(c.name.substring(0,3));
                return c;
            });
            $scope.sel.corpora = $scope.sel.corpora.filter(function (c) {
                return $scope.corpora.filter(function (d) {
                    return c === d.name;
                }).length > 0;
            })*/
        }

        $scope.deleteAllUserCorpora = function () {
            userCorpora.clear();
        };

        //updateCorpora();
/*
        $scope.languages = $scope.corpora.reduce(function (prev, curr, i) {
            if (i == 0) {
                return prev.concat([curr.language]);
            } else if (prev.indexOf(curr.language) == -1) {
                return prev.concat([curr.language]);
            } else {
                return prev;
            }
        }, []);*/

        function assignTranslations () {
            $scope.metrics = [
                {key: 1, title: $translate.instant('CON_METRIC1')},
                {key: 2, title: $translate.instant('CON_METRIC2')},
                {key: 3, title: $translate.instant('CON_METRIC3')}
                //    {key: 4, title: "Anteil unterschiedlicher Wörter"},
                //    {key: 5, title: "Kendalls Tau - basierend auf Rang"},
                //    {key: 6, title: "Mass nach UQ - basierend auf Rang"},
                //    {key: 7, title: "Cosinus - basierend auf Rang"},
                //    {key: 8, title: "Cosinus - basierend auf Freq."},
                //    {key: 9, title: "Cosinus - basierend auf Logarithmus d. Freq."}
            ];

            $scope.metricgroup = function (x) {
                //    return ( x.key < 5 ? "Versch." : "Gleiche" ) + " Listenlängen";
            };

            // validation function for form
            $scope.validation = function () {
                if ($scope.sel.corpora.length < 2) {
                    return $translate.instant('CON_VALIDATIONMSG');
                } else {
                    return '';
                }

            };

            $scope.heatMapColors = matrixVisualization.heatMap.colors().map(function (x) {
                return {
                    key : x,
                    name : $translate.instant('COLORSCALE_' + x)
                };
            });

            // Submit Job Request and queue up jobs
            $scope.submit = function () {
                var job = {
                    wordCount: $scope.wordCount,
                    corpora: $scope.corpora.filter(function (c) {
                        var filter = false;
                        $scope.sel.corpora.forEach(function (s) {
                            if (s === c.name) filter = true;
                        });
                        return filter;
                    }),
                    metric: $scope.sel.metric,
                    requestName: $scope.requestName === "" ? $translate.instant('SEC_JOBS_UNTITLED') : $scope.requestName
                };
                if (!$scope.validation()) {
                    jobManager.issueJob(job).then(function (data) {
                        showFeature.Visualisierung = false;
                        $scope.draw(data);
                        jobManager.currentJob(job);
                    });
                }
            };
        }

        $rootScope.$on('$translateChangeSuccess', assignTranslations);
        assignTranslations();

        $scope.paginationSize = 10;
        $scope.setPaginationSize = function (s) {
            $scope.paginationSize = s;
        };
        window.setPaginationSize = $scope.setPaginationSize;

        $scope.statistic = {
            files: [],
            resultLists : [],
            safe : {}
        };


        $scope.$watch('sel.PosTags', function(val) {
            var elem = angular.element('.st-global-search');
            elem.val(val || '');
            angular.element(elem).trigger('input');

        });
        $scope.sortings = matrixVisualization.sortings;
        $scope.maxClusterDiameter = matrixVisualization.maxClusterDiameter();
        $scope.limit = 125;

        // feature display toggle
        var showFeature = {
            'Konfiguration' : false,
            'Jobauswahl' : false
        };
        $scope.show = function (id, write) {
            if (typeof showFeature[id] === 'undefined') {
                showFeature[id] = true;
            }
            if (typeof write !== undefined && write) {
                showFeature[id] = !showFeature[id];
            }
            return showFeature[id];
        };



        $scope.deleteJob = jobManager.deleteJob;
        $scope.currentJob = jobManager.currentJob;
        $scope.resetJobs = function () {
            jobManager.clearJobs();
        };

        $scope.setConfig = function (j) {
            if ($scope.sel.corpora.length !== 0) {
                // bugfix
                $timeout(function () {$scope.setConfig(j)}, 200);
            }
            $scope.wordCount = j.wordCount;
            $scope.sel.metric = j.metric;
            $scope.requestName = j.requestName + "'";
            $scope.limit = Math.pow(2,32) - 1;
            $scope.sel.corpora = j.corpora;
            $timeout(function () {$scope.limit = 125}, 100);
        };

        $scope.selectJob = function (j) {
            jobManager.issueJob(j).then(function (data) {
                showFeature.Visualisierung = false;
                $scope.draw(data);
                jobManager.currentJob(j);
                jobManager.markJob(j, true);
            });
        };

        $scope.$watch('sel.colors', function (name) {
            matrixVisualization.heatMap.setMap.call(matrixVisualization.heatMap, name);
            if (jobManager.data())
                $scope.draw(jobManager.data());
        });

        $scope.$watch('sel.sorting', function (name) {
            matrixVisualization.setSorting(name);
            if (jobManager.data())
                $scope.draw(jobManager.data());
        });

        $scope.$watch(matrixVisualization.maxClusterDiameter, function (x) {
            $scope.maxClusterDiameter = x;
        }, true);

        $scope.$watch('maxClusterDiameter', function (x) {
            if (jobManager.data())
                $scope.draw(jobManager.data());
        }, true);

        $scope.parseFloat = parseFloat;

        $scope.$watch(matrixVisualization.currentPair, function (currentPair) {
            if (currentPair && !($scope.statsEmpty = currentPair[0] === currentPair[1])) {
                var currentRequest = jobManager.jobs().filter(function (j) {
                    return j.requestId === jobManager.currentJob()
                })[0];
                currentRequest.corpora = currentRequest.corpora.filter(function (c) {
                    return c.name === currentPair[0] || c.name === currentPair[1];
                });
                $http({
                    method: 'post',
                    url: '/api/corpora/resultlists',
                    timeout: 9999999999,
                    data: {'request' : currentRequest}
                }).success(function (data) {
                    console.log(data);
                    if (typeof data.source !== 'undefined') {
                        showFeature['Statistik'] = true;
                        var posTagSet = {};
                        ['onlySource', 'onlyTarget','moreSource', 'moreTarget'].forEach(function (listType) {
                            data[listType].forEach(function (word) {
                                posTagSet[word.pos] = true;
                            });
                        });
                        data.availablePOSTags = [];
                        for (var tag in posTagSet) {
                            if (posTagSet.hasOwnProperty(tag)) {
                                data.availablePOSTags.push(tag);
                            }
                        }
                        $scope.statistic.resultLists = data;
                        showFeature['Statistik'] = false;
                    }
                });
            }

        }, true);

        // Draw Visualization
        $scope.draw = function (data) {matrixVisualization.draw(data, $scope.maxClusterDiameter)};

        // Draw current job on controller instantiation
        jobManager.jobs().forEach(function (j) {
            if (jobManager.currentJob() === j.requestId){
                showFeature.Visualisierung = true;
                $scope.selectJob(j);
            }
        });

        $scope.updatecorp = function(){

            var y = data.corpora.filter(function(s){  console.log(s);
                //if( ($scope.datetype ==false && s.datetype == 'year') || ($scope.datetype ==true && s.datetype == 'day')  ){
                    if($scope.sel.languages.indexOf(s.language) != -1 ) {
                        console.log(s);
                        if($scope.sel.genres.indexOf(s.genre) != -1 ) {
                            return s;
                        }
                        
                    }
               //}
                
            });
            $scope.corpora = y;
            console.log(y);
        }

    });

