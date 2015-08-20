var Q = require('q');

exports.resourceManager = function (uniLeipzigClarinWs) {
    var resources = [];

    resourceManager = {
        register : register,
        action : action
    };
    resourceManager.register(uniLeipzigClarinWs);
    return resourceManager;

    function register (resource) {
        console.log('Registered resource: ' + resource.id);
        if (resources.filter(function (r) {return r.id === resource.id}).length || resources.length === 0)
            resources.push(resource);
    }

    function action (name, args) {
        return function () {
            var rQ = Q();
            var results = [];
            resources.forEach(function (r) {
                if (typeof r.action[name] === 'function') {
                    rQ = rQ
                        .then(r.action[name].bind(r, args))
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
