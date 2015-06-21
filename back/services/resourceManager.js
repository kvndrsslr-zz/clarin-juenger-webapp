var Q = require('q');

exports.resourceManager = function () {
    var resources = [];
    return {
        register : register,
        action : action
    };

    function register (resource) {
        if (resources.filter(function (r) {return r.id === resource.id}).length)
            resources.push(resource);
    }

    function action (name) {
        return function () {
            var rQ = Q();
            var results = [];
            resources.forEach(function (r) {
                if (typeof r.action[name] === 'function')
                    rQ = rQ
                        .then(r.action[name])
                        .then(function (result) {
                            results.concat(result)
                        });
            });
            return rQ.then(results);
        }
    }

};
