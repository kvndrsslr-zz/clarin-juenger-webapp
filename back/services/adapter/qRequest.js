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

exports.qPost = function () {
    return (function (url, formData, headers) {
        var deferred = Q.defer();
        request.post({
            url      : url,
            formData : formData,
            headers : headers
        }, function (err, response, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    });
};