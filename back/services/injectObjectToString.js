exports.injectObjectToString = function () {
    return function (s, o) {
        return s.replace(/{{.+}}/gm, function (str) {
            if (!o[str]) console.log('Unmatched property \'' + str + '\' in string \'' + s + '\'!');
            return o[str] || '?' ;
        });

    }
};