var dataLoaderRunner = [
    'dataLoader',
    function (dataLoader) {
        return dataLoader();
    }
];

angular.module('ir-matrix-cooc', ['ngRoute', 'ngSanitize', 'nsPopover',
        'ui.select', 'ui.keypress', 'ui.bootstrap', 'ui.bootstrap.tabs', 'LocalStorageModule', 'smart-table',
        'pascalprecht.translate','ngFileUpload'])
    .config(function ($routeProvider, $locationProvider, $translateProvider, localStorageServiceProvider) {
        $routeProvider
            .when('/corpora/', {
                templateUrl: '/html/corpora/getIndex.html',
                controller: 'corporaController',
                resolve: {
                    data: dataLoaderRunner
                }
            })
            .when('/words/', {
                templateUrl: '/html/words/getIndex.html',
                controller: 'wordsController',
                resolve: {
                    data: dataLoaderRunner
                }
            })
            .when('/manual/', {
                templateUrl: '/html/manual/getIndex.html',
                controller: 'headerController',
                resolve: {
                    data: dataLoaderRunner
                }
            })
            .otherwise({
                redirectTo: '/corpora/'
            });
        $locationProvider.html5Mode(true);
        localStorageServiceProvider.setPrefix('ir-matrix-cooc');
        $translateProvider.translations('en', {
            'APP_TITLE' : 'Corpus Comparison',
            'NAV_CORPORA' : 'Similarity Matrix',
            'NAV_WORDS' : 'Word Frequency Analysis',
            'NAV_HELP' : 'Help',
            'SEC_UPLOAD' : 'Upload Own Corpus',
            'SEC_UPLOAD_CHOOSEFILE' : 'File',
            'SEC_UPLOAD_NAME' : 'Name',
            'SEC_UPLOAD_FILESELECT' : 'Select a file on your computer or drop it here.',
            'SEC_UPLOAD_FILETYPE' : 'Filetype',
            'SEC_UPLOAD_FORMAT_PLAIN' : 'Plaintext',
            'SEC_UPLOAD_FORMAT_TCF' : 'TCF',
            'SEC_UPLOAD_SEND' : 'Upload',
            'SEC_UPLOAD_VALIDATIONSELECTFILE' : 'Please select a file to upload first!',
            'SEC_UPLOADED_HEADING' : 'Uploaded Corpora',
            'SEC_UPLOADED_EMPTY' : 'No corpus uploaded yet.',
            'SEC_UPLOADED_NAME' : 'Name',
            'SEC_UPLOADED_SIZE' : 'Size',
            'SEC_UPLOADED_DELETE' : 'Delete',
            'SEC_UPLOADED_DELETEALL' : 'Delete all',
            'SEC_CONFIG' : 'Configuration',
            'SEC_CONFIG_WORDLISTLENGTH' : 'Maximal number of words considered ({{wordlistLength}})',
            'SEC_CONFIG_REQUESTNAME' : 'Job title',
            'SEC_CONFIG_CORPUSSELECTION_TEXT' : 'Corpora',
            'SEC_CONFIG_CORPUSSELECTION_FILLIN' : 'Please choose...',
            'SEC_CONFIG_LANGUAGESELECTION_TEXT' : 'Language',
            'SEC_CONFIG_LANGUAGESELECTION_FILLIN' : 'Please choose...',
            'SEC_CONFIG_GENRESELECTION_TEXT' : 'Genre',
            'SEC_CONFIG_GENRESELECTION_FILLIN' : 'Please choose...',
            'SEC_CONFIG_SIMMEASURE' : 'Word similarity measure',
            'SEC_CONFIG_SEND' : 'Compute',
            'SEC_CONFIG_USERLANGTYPE' : '\'User-defined',
            'SEC_JOBS' : 'Job Selection',
            'SEC_JOBS_NOJOBS' : 'No jobs yet in this session.',
            'SEC_JOBS_MORE' : '{{count}} more',
            'SEC_JOBS_RESET' : 'Reset',
            'SEC_JOBS_UNTITLED' : 'Untitled',
            'SEC_VIS' : 'Visualisation',
            'SEC_VIS_CLUSTERTHRESHHOLD' : 'Cluster threshold ({{threshold}})',
            'SEC_VIS_COLORSCALE' : 'Color scale',
            'SEC_VIS_SORTING' : 'Sorting',
            'SEC_STATS' : 'Word Statistics',
            'SEC_STATS_TITLEBOTH' : 'More frequent in {{corpus}}',
            'SEC_STATS_TITLEONLY' : 'Only in {{corpus}}',
            'SEC_STATS_WORD' : 'Word',
            'SEC_STATS_POS' : 'POS',
            'SEC_STATS_POSLABEL' : 'Filter POS',
            'SEC_STATS_POS_ADJ' : 'adjective',
            'SEC_STATS_POS_ADP' : 'adposition',
            'SEC_STATS_POS_ADV' : 'adverb',
            'SEC_STATS_POS_AUX' : 'auxiliary verb',
            'SEC_STATS_POS_CONJ' : 'coordinating conjunction',
            'SEC_STATS_POS_DET' : 'determiner',
            'SEC_STATS_POS_INTJ' : 'interjection',
            'SEC_STATS_POS_NOUN' : 'noun',
            'SEC_STATS_POS_NUM' : 'numeral',
            'SEC_STATS_POS_PART' : 'particle',
            'SEC_STATS_POS_PRON' : 'pronoun',
            'SEC_STATS_POS_PROPN' : 'proper noun',
            'SEC_STATS_POS_PUNCT' : 'punctuation',
            'SEC_STATS_POS_SCONJ' : 'subordinating conjunction',
            'SEC_STATS_POS_SYM' : 'symbol',
            'SEC_STATS_POS_VERB' : 'verb',
            'SEC_STATS_POS_X' : 'other',
            'SEC_STATS_RATIO' : 'log. Ratio',
            'SEC_STATS_COUNT' : 'Frequency',
            'SEC_STATS_RELCOUNT' : 'Rel. Frequency',
            'SEC_STATS_COUNTINX' : 'Frequency in {{x}}',
            'SEC_STATS_RELCOUNTINX' : 'Rel. Frequency in {{x}}',
            'SEC_STATS_PAGINATIONSIZE' : 'Words shown per page ({{x}})',
            'SEC_WCONF' : 'Configuration',
            'SEC_WCONF_DATETYPE' : 'by Years or Weeks',
            'SEC_WCONF_WORDS' : 'Words',
            'SEC_WCONF_WORDSHINT' : '(multiple words separated by comma)',
            'SEC_WCONF_FIRSTY' : 'First year ({{year}})',
            'SEC_WCONF_LASTY' : 'Last year ({{year}})',
            'SEC_WCONF_LOGSWITCH' : 'Use logarithmic y-scale',
            'SEC_WORDS' : 'Visualisation',
            'SEC_WORDS_LABELGLUE' : '"{{label}}" in {{corpus}}',
            'SEC_WORDS_YLABEL' : 'Relative frequency',
            'CON_VALIDATIONMSG' : 'Please choose 2 corpora minimum!',
            'CON_METRIC1' : 'Cosine - based on rank',
            'CON_METRIC2' : 'Cosine - based on frequency',
            'CON_METRIC3' : 'Cosine - based on logarithm of frequency',
            'COLORSCALE_REDDISH' : 'Reddish (default)',
            'COLORSCALE_REDDISH_FOR_LOW' : 'Reddish (low similarity)',
            'COLORSCALE_REDDISH_FOR_HIGH' : 'Reddish (high similarity)',
            'COLORSCALE_BLUEISH' : 'Blueish',
            'COLORSCALE_GREY' : 'Gray (cluster clarity)',
            'SORT_ORDER_NAME' : 'Name',
            'SORT_ORDER_GROUP' : 'Group',
            'SORT_ORDER_CLUSTER' : 'Cluster',
            'ST_PAGINATION_FIRST' : 'First',
            'ST_PAGINATION_LAST' : 'Last',
            'ST_PAGINATION_OF' : 'of'
        }).translations('de', {
                'APP_TITLE' : 'Korpusvergleich',
                'NAV_CORPORA' : 'Ähnlichkeitsmatrix',
                'NAV_WORDS' : 'Worthäufigkeitsanalyse',
                'NAV_HELP' : 'Hilfe',
                'SEC_UPLOAD' : 'Eigenes Korpus hochladen',
                'SEC_UPLOAD_CHOOSEFILE' : 'Datei',
                'SEC_UPLOAD_NAME' : 'Name',
                'SEC_UPLOAD_FILESELECT' : 'Bitte Datei auswählen oder hinziehen.',
                'SEC_UPLOAD_FILETYPE' : 'Dateiformat',
                'SEC_UPLOAD_FORMAT_PLAIN' : 'Klartext',
                'SEC_UPLOAD_FORMAT_TCF' : 'TCF',
                'SEC_UPLOAD_SEND' : 'Hochladen',
                'SEC_UPLOAD_VALIDATIONSELECTFILE' : 'Bitte zuerst eine Datei auswählen!',
                'SEC_UPLOADED_EMPTY' : 'Noch kein eigenes Korpus hochgeladen.',
                'SEC_UPLOADED_HEADING' : 'Hochgeladene Korpora',
                'SEC_UPLOADED_NAME' : 'Name',
                'SEC_UPLOADED_SIZE' : 'Anzahl Wörter',
                'SEC_UPLOADED_DELETE' : 'Löschen',
                'SEC_UPLOADED_DELETEALL' : 'Alle löschen',
                'SEC_CONFIG' : 'Konfiguration',
                'SEC_CONFIG_WORDLISTLENGTH' : 'Länge Wortliste ({{wordlistLength}})',
                'SEC_CONFIG_REQUESTNAME' : 'Anfragebezeichner',
                'SEC_CONFIG_CORPUSSELECTION_TEXT' : 'Hier zu vergleichende Korpora auswählen, Filterung nach DB-Bez. oder int. Sprachennamen',
                'SEC_CONFIG_CORPUSSELECTION_FILLIN' : 'Bitte auswählen...',
                'SEC_CONFIG_LANGUAGESELECTION_TEXT' : 'Bitte Sprache auswählen',
                'SEC_CONFIG_LANGUAGESELECTION_FILLIN' : 'Bitte auswählen...',
                'SEC_CONFIG_GENRESELECTION_TEXT' : 'Bitte Typ auswählen',
                'SEC_CONFIG_GENRESELECTION_FILLIN' : 'Bitte auswählen...',
                'SEC_CONFIG_SIMMEASURE' : 'Vergleichsmaß',
                'SEC_CONFIG_SEND' : 'Abschicken',
                'SEC_CONFIG_USERLANGTYPE' : 'Benutzerdefiniert',
                'SEC_JOBS' : 'Jobauswahl',
                'SEC_JOBS_NOJOBS' : 'Bisher wurden keine Anfragen in dieser Session getätigt.',
                'SEC_JOBS_MORE' : '{{count}} weitere',
                'SEC_JOBS_RESET' : 'Zurücksetzen',
                'SEC_VIS' : 'Visualisierung',
                'SEC_VIS_CLUSTERTHRESHHOLD' : 'Clusterschwellwert ({{threshold}})',
                'SEC_VIS_COLORSCALE' : 'Farbskala',
                'SEC_VIS_SORTING' : 'Sortierung',
                'SEC_STATS' : 'Statistik',
                'SEC_STATS_TITLEBOTH' : 'Häufiger in {{corpus}}',
                'SEC_STATS_TITLEONLY' : 'Nur in {{corpus}}',
                'SEC_STATS_WORD' : 'Wort',
                'SEC_STATS_POS' : 'POS',
                'SEC_STATS_RATIO' : 'Log. Verhältnis',
                'SEC_WCONF_WORDSHINT' : '(Mehrere mit Komma trennen)',
                'SEC_STATS_COUNT' : 'Häufigkeit',
                'SEC_STATS_COUNTINX' : 'Häufigkeit in {{x}}',
                'SEC_WCONF_WORDS' : 'Wörter',
                'SEC_WCONF_DATETYPE' : 'nach Jahren oder Wochen',
                'SEC_WCONF_FIRSTY' : 'Startjahr ({{year}})',
                'SEC_WCONF_LASTY' : 'Endjahr ({{year}})',
                'SEC_WCONF' : 'Konfiguration',
                'SEC_WCONF_LOGSWITCH' : 'Logarithmische y-Skala.',
                'SEC_WORDS' : 'Liniendiagramm',
                'SEC_WORDS_LABELGLUE' : '"{{label}}" bei {{corpus}}',
                'SEC_WORDS_YLABEL' : 'Relative Häufigkeit',
                'CON_VALIDATIONMSG' : 'Bitte mindestens 2 Korpora auswählen!',
                'CON_METRIC1' : 'Cosinus - basierend auf Rang',
                'CON_METRIC2' : 'Cosinus - basierend auf Freq.',
                'CON_METRIC3' : 'Cosinus - basierend auf Logarithmus d. Freq.',
                'SORT_ORDER_NAME' : 'Name',
                'SORT_ORDER_GROUP' : 'Gruppe',
                'SORT_ORDER_CLUSTER' : 'Cluster',
                'ST_PAGINATION_FIRST' : 'Erste',
                'ST_PAGINATION_LAST' : 'Letzte',
                'ST_PAGINATION_OF' : 'von',
                'SEC_STATS_POS_ADJ' : 'Adjektiv',
                'SEC_STATS_POS_ADP' : 'Adposition',
                'SEC_STATS_POS_ADV' : 'Adverb',
                'SEC_STATS_POS_AUX' : 'Hilfsverb',
                'SEC_STATS_POS_CONJ' : 'Koordinierende Konjunktion',
                'SEC_STATS_POS_DET' : 'Determinator',
                'SEC_STATS_POS_INTJ' : 'Interjektion',
                'SEC_STATS_POS_NOUN' : 'Nomen',
                'SEC_STATS_POS_NUM' : 'Numeral',
                'SEC_STATS_POS_PART' : 'Partikel',
                'SEC_STATS_POS_PRON' : 'Pronomen',
                'SEC_STATS_POS_PROPN' : 'Eigenname',
                'SEC_STATS_POS_PUNCT' : 'Interpunktion',
                'SEC_STATS_POS_SCONJ' : 'Subordinierende Konjunktion',
                'SEC_STATS_POS_SYM' : 'Symbol',
                'SEC_STATS_POS_VERB' : 'Verb',
                'SEC_STATS_POS_X' : 'N/A'
            })
            .preferredLanguage('en')
            .fallbackLanguage('en');
    })
    .service('dataLoader', function ($location, $http) {
        return function () {
            if (typeof preloadedData !== "undefined" && preloadedData) {
                var data = preloadedData;
                preloadedData = null;
                return data;
            } else {
                return $http.get( '/api' + $location.path() ).then(function (res) {
                    return res.data;
                });
            }
        };
    })
    .provider('requestNotification', function () {
        // This is where we keep subscribed listeners
        var onRequestStartedListeners = [];
        var onRequestEndedListeners = [];

        // This is a utility to easily increment the request count
        var count = 0;
        var requestCounter = {
            increment: function () {
                count++;
            },
            decrement: function () {
                if (count > 0) {
                    count--;
                }
            },
            getCount: function () {
                return count;
            }
        };
        // Subscribe to be notified when request starts
        this.subscribeOnRequestStarted = function (listener) {
            onRequestStartedListeners.push(listener);
        };

        // Tell the provider, that the request has started.
        this.fireRequestStarted = function (request) {
            // Increment the request count
            requestCounter.increment();
            //run each subscribed listener
            angular.forEach(onRequestStartedListeners, function (listener) {
                // call the listener with request argument
                listener(request);
            });
            return request;
        };

        // this is a complete analogy to the Request START
        this.subscribeOnRequestEnded = function (listener) {
            onRequestEndedListeners.push(listener);
        };


        this.fireRequestEnded = function () {
            requestCounter.decrement();
            var passedArgs = arguments;
            angular.forEach(onRequestEndedListeners, function (listener) {
                listener.apply(this, passedArgs);
            });
            return arguments[0];
        };

        this.getRequestCount = requestCounter.getCount;

        //This will be returned as a service
        this.$get = function () {
            var that = this;
            // just pass all the
            return {
                subscribeOnRequestStarted: that.subscribeOnRequestStarted,
                subscribeOnRequestEnded: that.subscribeOnRequestEnded,
                fireRequestEnded: that.fireRequestEnded,
                fireRequestStarted: that.fireRequestStarted,
                getRequestCount: that.getRequestCount
            };
        };
    })
    .directive('loadingWidget', function (requestNotification) {
        return {
            restrict: "C",
            link: function (scope, element) {
                // hide the element initially
                jQuery('.loading-widget').addClass('hidden');

                //subscribe to listen when a request starts
                requestNotification.subscribeOnRequestStarted(function () {
                    // show the spinner!
                    jQuery('.loading-widget').removeClass('hidden');
                });

                requestNotification.subscribeOnRequestEnded(function () {
                    // hide the spinner if there are no more pending requests
                    if (requestNotification.getRequestCount() === 0) {
                        jQuery('.loading-widget').addClass('hidden');
                    }
                });
            }
        };
    })
    .config(function (
        $httpProvider,
        requestNotificationProvider) {
        $httpProvider.defaults.transformRequest.push(function (data) {
            requestNotificationProvider.fireRequestStarted(data);
            return data;
        });

        $httpProvider.defaults.transformResponse.push(function (data) {
            requestNotificationProvider.fireRequestEnded(data);
            return data;
        });

    })
    .directive('pageSelect', function() {
        return {
            restrict: 'E',
            template: '<input type="text" class="select-page" ng-model="inputPage" ng-change="selectPage(inputPage)">',
            link: function(scope, element, attrs) {
                scope.$watch('currentPage', function(c) {
                    scope.inputPage = c;
                });
            }
        }
    })
    .filter("rounded",function(){
        return function(val,to){
            return parseFloat(val).toFixed(to || 0);
        }
    }).run(['$templateCache', function ($templateCache) {
    $templateCache.put('template/smart-table/pagination2.html',
        '<nav ng-if="pages.length >= 2">' +
        '<ul class="pagination">' +
        '<li><a ng-click="selectPage(1)">{{\'ST_PAGINATION_FIRST\' | translate}}</a>' +
        '</li><li><a ng-click="selectPage(currentPage - 1)">&lt;</a>' +
        '</li><li><a><page-select></page-select> {{\'ST_PAGINATION_OF\' | translate}} {{numPages}}</a>' +
        '</li><li><a ng-click="selectPage(currentPage + 1)">&gt;</a>' +
        '</li><li><a ng-click="selectPage(numPages)">{{\'ST_PAGINATION_LAST\' | translate}}</a></li>' +
        '</ul>' +
        '</nav>');
}]);
