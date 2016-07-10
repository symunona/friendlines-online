console.log('initing worker');

onmessage = function(message) {
    if (message.command == 'parse') {
        postMessage('pina');
    }

};