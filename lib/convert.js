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

    // var fs = undefined; //require("fs");
    // var utils = undefined; //require('../facebook-extract-message-history/zip-utils');
    // var analyze = undefined; //require('../analyze-facebook-history/analyze');
    // var convertUtils = undefined; //require('../friendlines-convert-utils/convert-utils');
    // var child_process = undefined; //require('child_process');
    // var languages = JSON.parse(fs.readFileSync('node_modules/facebook-extract-message-history/languages.json'));

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
            return languages.find(function(l) {
                return l.key == convertViewModel.languageFromTheList();
            });
        } else {
            return {
                name: 'newLang',
                key: convertViewModel.languageKey(),
                dateformat: convertViewModel.dateFormat(),
            };
        }

    });
    convertViewModel.languageFromTheList.subscribe(function(val) {
        if (val) {
            var lang = languages.find(function(l) {
                return l.key == val;
            });
            convertViewModel.languageKey(lang.key);
            convertViewModel.dateFormat(lang.dateformat);
        }
    });

    return convertViewModel;

    /**
     * If we had files parsed and opened, load the cache,
     * do not run conversion!
     */
    function init(callbackIfPreload) {
        if (storage.exists(ACTUAL_USER_NAME)) {
            var userName = storage.load(ACTUAL_USER_NAME);
            console.log('Cache found, loading files');
            loadFromCache(userName);
            callbackIfPreload();
        }
        convertViewModel.languageFromTheList(languages[0].key);
    }

    /**
     * Loads the data without conversion from the 
     * exported JSON files.
     */
    function loadFromCache(userName) {
        ui.status('Loading parsed data for ' + userName);
        try {
            var messageData = JSON.parse(fs.readFileSync(userName + '.filtered.json'));
            var userActivity = JSON.parse(fs.readFileSync(userName + '.stat.1.json'));
            loadDataToUser(messageData, userActivity);
            ui.status('Loaded from cache: ' + userName);
            storage.save(ACTUAL_USER_NAME, userName);
        } catch (e) {
            ui.status('Error opening cache file');
        }
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
            deferred.resolve(startParsing(file));
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
        console.log('filename ', file);
        parser.parse(file);


        // utils.parseAsync(filename, convertViewModel.language(), ui.progress).then(function(userRawData) {
        //     var userName = utils.getUserNameFromZipFileName(filename);
        //     ui.status('Analyzing file...');

        //     /* Analyze data, get and merge main user, remove group messages, indicate emotions */
        //     var userFilteredData = analyze.analyze(userRawData);

        //     /* Export the file to the working dir for next time. */
        //     fs.writeFileSync(userName + '.filtered.json', JSON.stringify(userFilteredData));

        //     ui.status('File parsed results, written to ' + userName + '.filtered.json');

        //     /* Create per-user statistics */
        //     var userActivity = convertUtils.userActivityByMonth(userFilteredData);

        //     fs.writeFileSync(userName + '.stat.1.json', JSON.stringify(userActivity));

        //     ui.status('File parsed results, written to ' + userName + '.stat.1.json');

        //     ui.loading(false);

        //     storage.save(ACTUAL_USER_NAME, userName);

        //     appendToLastOpenedList(userName);

        //     loadDataToUser(userFilteredData, userActivity);

        //     /* If new language, post it, for the others. */
        //     if (convertViewModel.language().name == "newLang")
        //         $.post('http://friendlines.org/newlang', JSON.stringify(convertViewModel.language()));

        //     deferred.resolve({
        //         messageData: userFilteredData,
        //         userActivity: userActivity
        //     });
        // }).catch(function(error) {
        //     ui.status(error.message);
        //     ui.loading(false);
        //     console.error(error);
        // });
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

});