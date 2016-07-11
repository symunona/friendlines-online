define(['lib/extract/html-message-parse-utils', 'lib/ui', 'q'],

    function(utils, ui, Q) {

        var worker = new Worker('lib/extract/worker.js');
        var deferred = null;

        worker.onmessage = function(message) {

            if (message.data.command == 'message') {
                ui.status(message.data.message);
            }
            if (message.data.command == 'done') {
                deferred.resolve(message.data.user);
            }
            if (message.data.command == 'total') {
                ui.progress.total(message.data.value);
            }
            if (message.data.command == 'percent') {
                ui.progress.percent(message.data.value);
            }
            if (message.data.command == 'tick') {
                ui.progress.tick();
            }
        };
        return {
            parse: function(file, language) {
                deferred = Q.defer();
                worker.postMessage({
                    command: 'parse',
                    language: language,
                    file: file
                });
                return deferred.promise;
            }
        };

    });