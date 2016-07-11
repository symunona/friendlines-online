/**
 * Registers require and creates a worker 
 * which listens to messages. On parse command
 * it extracts the file got, analyzes it (adds)
 * emotional metadata and got
 */

importScripts('../../node_modules/requirejs/require.js');

requirejs.config({
    baseUrl: '../../',
    paths: {
        knockout: 'node_modules/knockout/build/output/knockout-latest.debug',
        wrap: 'lib/utils/knockout.wrap',
        text: 'node_modules/requirejs-text/text',
        json: 'node_modules/requirejs-plugins/src/json',
        convert: '../friendlines-convert-1',
        underscore: 'node_modules/underscore/underscore-min',
        moment: 'node_modules/moment/min/moment.min',
        jszip: 'node_modules/jszip/dist/jszip',
        q: 'node_modules/q/q'
    }
});


require([
        'lib/extract/html-message-parse-utils',
        'lib/extract/zip-utils',
        'lib/analyze/analyze',
        'lib/convert/1/convert'
    ],
    function(
        parseUtils,
        zipUtils,
        analyze,
        convert
    ) {

        /** 
         * This is a wrapper object what communicates
         * with the parser.js for updating the UI while
         * loading.
         */
        var ticker = {
            total: function(val) {
                postMessage({
                    command: 'total',
                    value: val
                });
            },
            tick: function() {
                postMessage({
                    command: 'tick'
                });
            },
            percent: function(val) {
                postMessage({
                    command: 'percent',
                    value: val
                });
            }
        };

        /**
         * Listen to messages from main thread.
         * On parse message, ectract and process
         * the file.
         */
        onmessage = function(message) {

            if (message.data.command == 'parse') {
                var file = message.data.file;
                var language = message.data.language;
                parseAndAnalyze(file, language);
            }

        };

        /**
         * 1.- Extracts the HTML to JS object
         * 2.- Analyzes the messages: 
         *      a.- finds the main usernames
         *      b.- merges the ID's of the main user
         *      c.- removes group messages
         * 3.- Create user activity data grouped by months.
         */
        function parseAndAnalyze(file, language) {
            postMessage({
                command: 'message',
                message: 'Extracting file ' + file.name
            });

            zipUtils.getMessagesRawFromJSZip(file, ticker).then(
                    function(rawData) {
                        postMessage({
                            command: 'message',
                            message: 'File extracted. Parsing... '
                        });

                        /* Parse HTML into JS */
                        var extractedData = parseUtils.parseWorker(rawData, language, ticker);

                        postMessage({
                            command: 'message',
                            message: 'Found ' + extractedData.messages.length + ' threads, analyzing file ' + file.name
                        });

                        /* Analyzes data: finds main usernames, merge them into 1 ID, remove group messages */
                        var userFilteredData = analyze.analyze(extractedData);

                        postMessage({
                            command: 'message',
                            message: 'Found main usernames: ' + userFilteredData.parsingMetaData.mainUserNames + '. Converting to monthly activity...'
                        });

                        /* Create user activity data grouped by months. */
                        userActivity = convert.convert(userFilteredData, ticker);

                        /* Return the processed data to the main thread */
                        postMessage({
                            command: 'done',
                            user: {
                                messageData: userFilteredData,
                                userActivity: userActivity
                            }
                        });

                    })
                .fail(function(error) {
                    console.error(error.message);
                    console.error(error.stack);
                    postMessage({
                        command: 'message',
                        message: 'Error extracting file: ' + file.name
                    });
                });
        }


    });