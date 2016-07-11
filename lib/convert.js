define([
    'knockout',
    'lib/ui',
    'storage',
    'lib/user',
    'json!lib/utils/languages.json',
    'lib/extract/zip-utils',
    'lib/extract/parser'

], function(ko, ui, storage, user, languages, zipUtils, parser) {
    'use strict';

    const ACTUAL_USER_NAME = 'actualUserName';
    const LAST_OPENED_USERNAMES = 'lastOpenedUserNames';
    const WEB_STORAGE_NOTIF = 'alreadyNotifiedCache';


    /* 400 MB quota should be enough for all the cached files */
    var FILE_QUOTA = 1024 * 1024 * 400;
    var fs = null;
    var _callbackIfPreload = null;

    var convertViewModel = {
        selectFile: selectFile,
        convert: convert,
        init: init,
        getLastOpenedList: getLastOpenedList,
        loadFromCache: loadFromCache,
        languages: languages,
        dateFormat: ko.observable(),
        languageKey: ko.observable(),
        languageFromTheList: ko.observable()
    };

    convertViewModel.language = ko.computed(function() {
        if (convertViewModel.languageFromTheList()) {
            return _.findWhere(languages, {
                key: convertViewModel.languageFromTheList()
            });
        } else {
            return {
                name: 'newLang',
                key: convertViewModel.languageKey(),
                dateFormat: convertViewModel.dateFormat(),
            };
        }

    });
    convertViewModel.languageFromTheList.subscribe(function(val) {
        if (val) {
            var lang = _.findWhere(languages, {
                key: val
            });
            convertViewModel.languageKey(lang.key);
            convertViewModel.dateFormat(lang.dateFormat);
        }
    });

    return convertViewModel;

    /**
     * If we had files parsed and opened, load the cache,
     * do not run conversion!
     */
    function init(callbackIfPreload) {
        _callbackIfPreload = callbackIfPreload;
        /* Open file system object, if exists. */
        if (navigator.webkitPersistentStorage) {
            navigator.webkitPersistentStorage
                .requestQuota(FILE_QUOTA, function(grantedBytes) {
                    window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, fileApiErrorHandler);
                }, function(e) {
                    console.log('FS Error', e);
                });
        } else {

            if (!storage.load(WEB_STORAGE_NOTIF)) {
                storage.save(WEB_STORAGE_NOTIF, true);
                alert('Hey! Your browser is not having file system API support. Caching your converted data will not work, meaning you will have to load and convert your files every time. You can avoid this by installing Chrome.');
            }
        }

        convertViewModel.languageFromTheList(languages[0].key);
    }

    /**
     * Loads the data without conversion from the 
     * exported JSON files.
     */
    function loadFromCache(userName) {
        ui.status('Loading parsed data for ' + userName);

        return $.when(readFileAsText(userName + '.filtered.json'), readFileAsText(userName + '.stat.1.json'))
            .then(function(messageDataString, userActivityString) {
                try {
                    var messageData = JSON.parse(messageDataString);
                    var userActivity = JSON.parse(userActivityString);
                    loadDataToUser(messageData, userActivity);
                    ui.status('Loaded from cache: ' + userName);
                    storage.save(ACTUAL_USER_NAME, userName);
                } catch (e) {
                    ui.status('Error opening cache file');
                }
            });
    }


    /**
     * Opens file dialog, loads and converts ZIP
     * @returns deferred resolved with userData
     */

    function selectFile() {
        var deferred = $.Deferred();
        ui.openFileDialog('.zip').done(function(filename, file) {

            ui.loading(true);
            ui.status('Opening ZIP archive ' + filename + '...');
            /* Let it render for loading*/
            setTimeout(function() {
                convert(file).done(function(userData) {
                    deferred.resolve(userData);
                });
            }, 0);
        });
        return deferred;
    }

    function convert(file) {
        var deferred = $.Deferred();
        ui.status('Loading and parsing file...');
        zipUtils.isFacebookArchiveZip(file).then(function(isFacebookArchive) {
            ui.status('Parsing history file, converting to JSON. This usually takes a while and might seem that the window is frozen for a longer while.');
            startParsing(file).then(function(data) {
                deferred.resolve(data);
            });

        }).fail(function(msg) {

            ui.status('Error reading fb history file');
            alert('I do not think that this is a facebook history zip. It may be corrupt?');
            deferred.reject();
        });

        return deferred;
    }

    /** 
     * Given the filename as a parameter starts a conversion
     * using the semi-async conversion, letting the UI to update.
     * For more info see parseAsync.
     */
    function startParsing(file) {

        // TODO: Check if already extracted, confirm overwrite, else, load from CACHE!

        var deferred = $.Deferred();

        console.log(convertViewModel.language());

        /* Parse the selected file while letting UI refresh */
        ui.loading(true);

        parser.parse(file, convertViewModel.language()).then(function(userData) {
            var userName = zipUtils.getUserNameFromZipFileName(file.name);

            // deferred.resolve(userData);

            loadDataToUser(userData.messageData, userData.userActivity);

            if (fs) {
                try {

                    writeToFile(userName + '.filtered.json', JSON.stringify(userData.messageData));

                    writeToFile(userName + '.stat.1.json', JSON.stringify(userData.userActivity));
                } catch (e) {
                    console.error(e);
                }
            }
            ui.loading(false);

            storage.save(ACTUAL_USER_NAME, userName);

            appendToLastOpenedList(userName);

            /* If new language, post it, for the others. */
            if (convertViewModel.language().name == "newLang")
                $.post('http://friendlines.org/newlang', JSON.stringify(convertViewModel.language()));

            /* Return new userdata */
            deferred.resolve(userData);
        }).fail(function(err) {
            ui.loading(false);
            ui.status(err.message);
            console.error(err.message);
            console.error(err.stack);
        });

        return deferred;
    }

    /**
     * Appends a username to the last opened list.
     */
    function appendToLastOpenedList(userName) {
        var lastOpenedList = storage.load(LAST_OPENED_USERNAMES);
        if (!lastOpenedList) lastOpenedList = [];
        if (lastOpenedList.indexOf(userName) == -1) lastOpenedList.push(userName);
        storage.save(LAST_OPENED_USERNAMES, lastOpenedList);
    }

    function getLastOpenedList() {
        return storage.load(LAST_OPENED_USERNAMES) || [];
    }

    function loadDataToUser(messageData, userActivity) {

        user.metaData(messageData.parsingMetaData);
        user.messages(messageData.messages);
        user.userActivity(userActivity);
        user.userName(messageData.parsingMetaData.userName);
    }

    /**
     * returns a promise
     */

    function readFileAsText(fileName) {
        var deferred = $.Deferred();
        fs.root.getFile(fileName, {}, function(fileEntry) {

            // Get a File object representing the file,
            // then use FileReader to read its contents.
            fileEntry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function(e) {
                    deferred.resolve(this.result);
                };

                reader.readAsText(file);
            }, fileApiErrorHandler);

        }, fileApiErrorHandler);
        return deferred;
    }

    function onInitFs(fileSystemApi) {
        fs = fileSystemApi;

        if (storage.exists(ACTUAL_USER_NAME) && navigator.webkitPersistentStorage) {
            var userName = storage.load(ACTUAL_USER_NAME);
            ui.status('Cache found, loading files...', userName);
            loadFromCache(userName).then(function() {
                if (_callbackIfPreload) _callbackIfPreload();
            });
        }

    }

    function writeToFile(fileName, data) {
        fs.root.getFile(fileName, {
            create: true
        }, function(fileEntry) {

            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function(fileWriter) {

                fileWriter.onwriteend = function(e) {
                    console.log('Cache saved to ' + fileName);
                };

                fileWriter.onerror = function(e) {
                    console.error('Write failed: ' + e.toString());
                };

                // Create a new Blob and write it to log.txt.
                var blob = new Blob([data], {
                    type: 'text/plain'
                });

                fileWriter.write(blob);

            }, fileApiErrorHandler);

        }, fileApiErrorHandler);
    }

    function fileApiErrorHandler(e) {
        var msg = '';

        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
        }

        console.log('Error: ' + msg);
    }

});