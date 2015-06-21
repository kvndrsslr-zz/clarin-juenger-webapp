var Q = require('q');

exports.resourceManager = function () {
    var resources = [];
    return {
        register : register,
        action : action
    };

    function register (resource) {
        console.log('Registered resource: ' + resource.id);
        if (resources.filter(function (r) {return r.id === resource.id}).length || resources.length === 0)
            resources.push(resource);
    }

    function action (name) {
        return function () {
            var rQ = Q();
            var results = [];
            console.log('r:' + resources.length);
            resources.forEach(function (r) {
                if (typeof r.action[name] === 'function') {
                    rQ = rQ
                        .then(r.action[name])
                        .then(function (result) {
                            results = results.concat(result);
                        });
                }
            });
            return rQ.then(function () {
                return results;
            });
        }
    }

};
