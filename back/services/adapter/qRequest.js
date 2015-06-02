var request = require('request');
var Q = require('q');

exports.qRequest = function () {
    return (function (url) {
        var deferred = Q.defer();
        request(url, function (err, response, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    });
};