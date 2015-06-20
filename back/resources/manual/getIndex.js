exports.getIndex = function (corporaSchemes) {
    var noSuffixSchemes = [];
    corporaSchemes.forEach(function (scheme) {
        if (!/_[0-9]{3}K$/.test(scheme)) {
            noSuffixSchemes.push(scheme);
        }
    });
    return {dbs: noSuffixSchemes};
};