angular.module('ir-matrix-cooc').controller('headerController',function($scope, $location) {
    $scope.getClass = function (path) {
        if ($location.path().substr(0, path.length) === path) {
            return "active";
        } else {
            return "";
        }
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