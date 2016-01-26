angular.module('ir-matrix-cooc').factory('userCorpora', function ($q, $http, $timeout, localStorageService, Upload) {

    var _data = false;

    function list () {
        return localStorageService.get('userCorpora$list') || [];
    }

    function add (uploadModel) {
        // get list of corpora
        var clientId = localStorageService.get('userCorpora$clientId');
        var suffix = parseInt(localStorageService.get('userCorpora$suffixCounter')) + 1;
        var list = localStorageService.get('userCorpora$list') || [];
        // check for unique displayName
        if (uploadModel.displayName === '')
            uploadModel.displayName = uploadModel.file.name;
        while (_.where(list, {displayName: uploadModel.displayName}).length > 0) {
            uploadModel.displayName = uploadModel.displayName + '\'';
        }
        // generate unique corpus id (clientId + suffix)
        uploadModel.name = clientId + '_' + suffix;
        Upload.upload({
            url: '/api/corpora/upload',
            data: {
                'name' : uploadModel.name,
                'displayName' : uploadModel.displayName,
                'filetype' : uploadModel.filetype,
                'file' : uploadModel.file
            }
        }).progress(function (evt) {
            uploadModel.progress = parseInt(100.0 * evt.loaded / evt.total);
        }).success(function (data, status, headers, config) {
            $timeout(function() {
                uploadModel.progress = 0;
                uploadModel.file = null;
                console.log(data);
                list.push(data);
                localStorageService.set('userCorpora$suffixCounter', suffix);
                localStorageService.set('userCorpora$list', list);
            }, 150);
        });
    }

    function remove (c) {
        var list = localStorageService.get('userCorpora$list') || [];
        var nList = list.filter(function (corpus) {
            return corpus.name !== c.name
        });
        localStorageService.set('userCorpora$list', nList);
    }

    /**
     * generate cryptographically (if available) unique client id
     */
    function generateClientId () {
        function byteToHex(byte) {
            return ('0' + byte.toString(16)).slice(-2);
        }
        var crypto = window.crypto || window.msCrypto;
        var array = [];
        if (crypto) {
            array = new Uint32Array(10);
            crypto.getRandomValues(array);
        } else {
            for (var i=0; i<10; i++) {
                array[i] = Math.round(Math.random() * Math.pow(10,10));
            }
        }
        return "usr_" + [].map.call(array, byteToHex).join("");
    }

    function clear () {
        localStorageService.set('userCorpora$suffixCounter', 0);
        localStorageService.set('userCorpora$list', []);
        localStorageService.set('userCorpora$clientId', generateClientId());
    }

    if (!localStorageService.get('userCorpora$clientId')) {
        clear();
    }


    return {
        list : list,
        add : add,
        remove : remove
    };
});