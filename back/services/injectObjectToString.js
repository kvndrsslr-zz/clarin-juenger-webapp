exports.injectObjectToString = function () {
    return function (s, o) {
        console.log('injecting ' + JSON.stringify(o) + ' into ' + s );
        return s.replace(/\{\{[^\}]+\}\}/gm, function (str) {
            str = str.substring(2, str.length-2);
            console.log('replacing: ' + str);
            if (!o[str]) console.log('Unmatched property \'' + str + '\' in string \'' + s + '\'!');
            return o[str] || '?' ;
        });

    }
};