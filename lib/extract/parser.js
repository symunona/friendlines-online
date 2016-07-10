define(['lib/extract/html-message-parse-utils'],

    function(utils) {

        var worker = new Worker('lib/extract/parser.js');
        console.log('worker is inited', worker);
        worker.onmessage = function() {
            console.log('from worker: ', arguments);
        };
        return {
            parse: function(file) {
                console.log('parse', file.name);
                worker.postMessage({
                    command: 'parse',
                    file: file
                });
            }
        };

    });