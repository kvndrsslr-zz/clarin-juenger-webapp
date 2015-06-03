exports.getIndex = function (corporaSchemes, getWordlistsDwds) {
    getWordlistsDwds().then(console.log.bind(null, "DWDS Abfrage fertig!"));
    var noSuffixSchemes = [];
    corporaSchemes.forEach(function (scheme) {
        if (!/_[0-9]{3}K$/.test(scheme)) {
            noSuffixSchemes.push(scheme);
        }
    });
    return {dbs: noSuffixSchemes};
};