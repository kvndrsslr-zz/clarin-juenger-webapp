exports.deep = function () {

    return {
        'set' : set,
        'get' : get
    };

    function set (obj, selector, value) {
        var stack = selector.split(".");
        var p = obj;
        stack.forEach(function (sel, i) {
            if (typeof p[sel] !== 'object')
                p[sel] = {};
            if (i === stack.length - 1) {
                p[sel] = value;
            } else {
                p = p[sel];
            }
        });
        return obj;
    }

    function get (obj, selector) {
        var stack = selector.split(".");
        var p = obj;
        var failed = false;
        stack.forEach(function (sel, i) {
            if (!failed && (i < stack.length - 1 ? (typeof p[sel] !== 'object') : (typeof p[sel] === 'undefined')))
                failed = true;
            if (!failed) {
                p = p[sel];
            }
        });
        return failed ? undefined : p;
    }
};