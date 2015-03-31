var dataLoaderRunner = [
    'dataLoader',
    function (dataLoader) {
        return dataLoader();
    }
];

angular.module('ir-matrix-cooc', ['ngRoute', 'ngSanitize', 'nsPopover',
    'ui.select', 'ui.keypress', 'ui.bootstrap', 'LocalStorageModule'])
    .config(function ($routeProvider, $locationProvider, localStorageServiceProvider) {
        $routeProvider
            .when('/korpora/', {
                templateUrl: '/html/korpora/getIndex.html',
                controller: 'korporaController',
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
                redirectTo: '/korpora/'
            });
        $locationProvider.html5Mode(true);
        localStorageServiceProvider.setPrefix('ir-matrix-cooc');
    })
    .service('dataLoader', function ($location, $http) {
        return function () {
            if (preloadedData) {
                var data = preloadedData;
                preloadedData = null;
                console.log(data);
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
    .filter("rounded",function(){
        return function(val,to){
            return parseFloat(val).toFixed(to || 0);
        }
    });
