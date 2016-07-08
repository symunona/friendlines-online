define([
    'knockout',
    'convert/process',
    'convert/draw',


], function(ko, process, draw) {

    return [{
        id: 'activity_snake',
        name: 'Snake',
        process: process,
        draw: draw,
        params: {
            xStep: 50,
            yStep: 20,
            yScale: 1,
            divider: 10,
            yFlatHeight: 10,
            type: 1,
            error: 1,
            minY: 0,
            layerOneKey: 'count',
            // layerTwoKey: 'happy'
        }
    }, {
        id: 'activity_morse',
        name: 'Binary',
        process: process,
        draw: draw,
        params: {
            xStep: 50,
            yStep: 20,
            yScale: 1,
            divider: 8,
            yFlatHeight: 15,
            type: 2,
            error: 1,
            layerOneKey: 'count',
        }
    }, ];

});