(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'jszip', 'q'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('jszip', 'q'));
    } else {
        // Browser globals
        factory((root.commonJsStrict = {}), root.b);
    }
}(this, function(exports, JSZip, Q, workers, parser) {



    // var AdmZip = require('adm-zip');
    // var extend = require('util')._extend;
    // var path = require('path');
    // var parserUtils = require('./html-message-parse-utils');

    /**
     * Gets the language of the ZIP and parses the 
     * threads.
     * @returns the messages and metadata.
     */

    exports.parse = function(inputFileName, progress) {

        var messagesRaw = exports.getMessagesRawFromZip(inputFileName);
        var lang = exports.getLanguageOfFacebookArchiveZip(inputFileName);
        var messageData = parserUtils.parse(messagesRaw, lang, progress);

        return messageData;
    };

    exports.parseAsync = function(inputFileName, progress) {

        var messagesRaw = exports.getMessagesRawFromZip(inputFileName);
        var lang = exports.getLanguageOfFacebookArchiveZip(inputFileName);

        return parserUtils.parsePromise(messagesRaw, lang, progress);
    };

    /**
     * Determines if the ZIP contains the necessary files for parsing
     * @returns {boolean} 
     */
    exports.isFacebookArchiveZip = function(file) {
        var deferred = Q.defer();
        var fileName = file.name;
        if (fileName && fileName.substring && fileName.substring(fileName.length - 4) == ".zip") {

            JSZip.loadAsync(file)
                .then(function(zip) {
                    var dateAfter = new Date();
                    var filesNeededFound = 0;

                    zip.forEach(function(relativePath, zipEntry) {
                        if (zipEntry.name == "index.htm") {
                            filesNeededFound++;
                        }
                        if (zipEntry.name == "html/messages.htm") {
                            filesNeededFound++;
                        }
                        // this is very sad, FB just removed this page, so now we have (2016 spring)
                        // to guess for the language
                        // if (zipEntry.name == "html/settings.htm") {
                        //     filesNeededFound++;
                        // }
                    });

                    if (filesNeededFound >= 2) {
                        deferred.resolve(true);
                    } else {
                        deferred.reject('This does not seem like a facebook history file.');
                    }

                }, function(e) {
                    console.error("Error reading " + fileName + " : " + e.message);
                    deferred.reject(e.message);
                });
        }
        return deferred.promise;
    };

    /**
     * @returns the zip entry as text within a ZIP file if found, otherwise false
     */
    exports.getStringFromZipEntryByName = function(zipFileName, entryFileName) {
        var zip = new AdmZip(zipFileName);
        var zipEntries = zip.getEntries();

        for (var i = 0; i < zipEntries.length; i++) {
            var zipEntry = zipEntries[i];
            if (zipEntry.entryName == entryFileName) {
                zip.readAsText(entryFileName);
                return zipEntry.getData().toString('utf8');
            }
        }
        return false;
    };



    /**
     * @returns a string of the messages DOM part
     */
    exports.getMessagesRawFromZip = function(zipFileName) {
        return exports.getStringFromZipEntryByName(zipFileName, "html/messages.htm");
    };

    exports.getMessagesRawFromJSZip = function(file, ticker) {
        var def = Q.defer();
        ticker.total(100);
        JSZip.loadAsync(file)
            .then(function(zip) {
                console.log('Extracting messages...');
                try {
                    zip.file("html/messages.htm")
                        .async("string", function(metadata) {
                            ticker.percent(metadata.percent);
                        })
                        .then(function(data) {
                            def.resolve(data);
                        });
                } catch (e) {
                    console.error(e);
                }
            });
        return def.promise;
    };

    /**
     * @returns the user's language setting string, formatted [lang]_[SUBTYPE]
     * i.e.: en_US
     */
    exports.getLanguageOfFacebookArchiveZip = function(zipFileName) {

        var settingsRaw = exports.getStringFromZipEntryByName(zipFileName, "html/settings.htm");

        /* This assumes that the language is in the second TD element */
        var lang = settingsRaw.match(/<td>(.*?)<\/td>/)[1];

        return lang;
    };

    /** 
     * Example: 'facebook-testuser.zip' will return 'testuser'
     * @returns username
     */
    exports.getUserNameFromZipFileName = function(fileName) {
        // var filename = zipFileName.substr(zipFileName.lastIndexOf('') path.basename(zipFileName);
        return filename.substr(9, filename.length - 4 - 9);
    };
}));