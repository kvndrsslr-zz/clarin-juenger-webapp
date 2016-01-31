angular.module('ir-matrix-cooc').factory('errorReporting', function () {

    var channels = {};

    function Channel (name, type) {
        return {
            'name' : name,
            'type' : type,
            'handlers' : []
        }
    }

    var channel = {
        'Channel': Channel,
        'add' : function (channel) {
            if (typeof channel === 'object' && channel instanceof Channel) {
                if (typeof channels[channel.type] === 'undefined')
                    channels[channel.type] = channel;
            }
        },
        'remove' : function (type) {
            if (channels[channel.type] instanceof Channel)
                channels[type] = undefined;
        }
    };

    function handler (type, fun) {
        if (typeof fun === 'function') {
            if (!type instanceof Array) {
                type = [type];
            }
            channels[type].handlers.push(fun);
            return {
                'unregister': function () {
                    channels[type].handlers.splice(channels[type].handlers.indexOf(fun), 1);
                }
            };
        }
    }

    function report (error, global) {
        if (typeof error === 'object') {
            if (global === true) {
                channels.forEach(function (channel) {
                    channel.handlers.forEach(function (handler) { handler(error) });
                });
            } else if (error.type && channels[error.type]) {
                channels[error.type].handlers.forEach(function (handler) { handler(error) });
            }
        }
    }

    return {
        'report' : report,
        'handler' : handler,
        'channel' : channel
    };
}).directive('errorreportBasic', function (errorReporting) {
    return {
        restrict : 'AE',
        replace : false,

    }
});