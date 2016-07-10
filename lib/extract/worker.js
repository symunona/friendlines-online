console.log('initing worker');
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
            }
        };

        onmessage = function(message) {

            if (message.data.command == 'parse') {
                var file = message.data.file;
                var language = message.data.language;
                parseAndAnalyze(file, language);
            }

        };

        function parseAndAnalyze(file, language) {
            postMessage({
                command: 'message',
                message: 'Extracting file ' + file.name
            });

            zipUtils.getMessagesRawFromJSZip(file).then(
                    function(rawData) {
                        postMessage({
                            command: 'message',
                            message: 'File extracted. Parsing... '
                        });

                        var extractedData = parseUtils.parseWorker(rawData, language, ticker);

                        postMessage({
                            command: 'message',
                            message: 'Found ' + extractedData.messages.length + ' threads, analyzing file ' + file.name
                        });

                        var userFilteredData = analyze.analyze(extractedData);

                        postMessage({
                            command: 'message',
                            message: 'Found main usernames: ' + userFilteredData.parsingMetaData.mainUserNames + '. Converting to monthly activity...'
                        });

                        userActivity = convert.convert(userFilteredData);

                        postMessage({
                            command: 'done',
                            user: {
                                userFilteredData: userFilteredData,
                                userActivity: userActivity
                            }
                        });

                    })
                .fail(function(params) {
                    console.error(params.stack);
                    postMessage({
                        command: 'message',
                        message: 'Error extracting file: ' + file.name
                    });

                    debugger;
                });
        }


    });