angular.module('ir-matrix-cooc').controller('headerController',function($scope, $location, $translate) {
    $scope.getClass = function (path) {
        if ($location.path().substr(0, path.length) === path) {
            return "active";
        } else {
            return "";
        }
    };

    $scope.setLang = function (lang) {
        $translate.use(lang);
    };

    var showFeature = {};
    $scope.show = function (id, write) {
        if (typeof showFeature[id] === 'undefined') {
            showFeature[id] = false;
        }
        if (typeof write !== undefined && write) {
            showFeature[id] = !showFeature[id];
        }
        return showFeature[id];
    };
});