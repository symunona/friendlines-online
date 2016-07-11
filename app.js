requirejs.config({
    baseUrl: '',
    paths: {
        knockout: 'node_modules/knockout/build/output/knockout-latest.debug',
        wrap: 'lib/utils/knockout.wrap',
        jQuery: 'node_modules/jquery/dist/jquery.min',
        text: 'node_modules/requirejs-text/text',
        json: 'node_modules/requirejs-plugins/src/json',
        convert: '../friendlines-convert-1',
        storage: 'lib/utils/storage',
        _: 'node_modules/underscore/underscore-min',
        d3: 'node_modules/d3/d3',
        moment: 'node_modules/moment/min/moment.min',
        jszip: 'node_modules/jszip/dist/jszip',
        q: 'node_modules/q/q',
        d3cloud: 'lib/utils/d3.layout.cloud'

    }
});


define([
    'knockout',
    'lib/templates',
    'lib/ui',
    'lib/processors',
    'lib/user',
    'lib/convert',
    'lib/filter',
    'lib/share',
    'text',
    'wrap',
    'json',
    'json!lib/utils/colors.json',
    'storage',
    'lib/utils/popup',
    'lib/stat',
    'lib/search',
    'moment',
    'd3'



], function(ko, templates, ui, processors, user, convert,
    filter, share, text, wrap, json,
    colors, storage, popup, stat, search,
    moment
) {

    const LAST_PROCESSOR = 'lastProcessor';

    var app = {
        error: ko.observable(''),
        templates: templates,
        ui: ui,
        user: user,
        processors: processors,
        filter: filter,
        colors: colors,
        lastOpenedList: ko.observableArray(convert.getLastOpenedList()),
        convert: convert,
        share: share,
        popup: popup,
        stat: stat,
        search: search,
        moment: moment,

        selectedUser: ko.observable(),

        link: ko.observable(),

        loadingtest: function() {
            ui.loading(true);
            ui.progress.percent(30);
            ui.status('');
        },

        loadFromCache: function(fileName) {
            convert.loadFromCache(fileName);
            app.preRender();
        },
        extract: function() {
            convert.selectFile().done(function() {
                app.preRender();
            });
        },
        openNew: function() {
            user.userName('');
        },
        downloadMessagesJson: function() {
            downloadFile(user.userName() + '.json', JSON.stringify(user.messages()));
        },
        saveSVG: function() {
            var svg = $('#timeline')[0].innerHTML;
            svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' + svg.substr(4);
            downloadFile(user.userName() + '.svg', svg);
        },

        preRender: function() {

            /* Apply the filter, get the filtered userlist and metadata back. */
            var f = wrap.toJS(filter.actual);

            var preProcessedUserData = app.actualProcessor().process(user.userActivity(), f);

            /* Update the renderable userlist */
            filter.actualRenderableUserList(preProcessedUserData);

            app.render();

        },
        render: function() {

            var params = app.actualProcessor().params;

            /* Render everything*/
            ui.loading(true);
            ui.status('Drawing...');
            var startDate = new Date();

            setTimeout(function() {
                var drawing = app.actualProcessor()
                    .draw.draw('#timeline', filter.usersToRender(), params, filter, user.metaData(), app);
                ui.loading(false);
                ui.status('Rendered in ' + ((new Date() - startDate) / 1000) + 'sec. Use dragging and zooming to navigate ');
                filter.save();

            }, 0);

        },
        switchProcessor: function(processor) {
            app.actualProcessor(processor);
            app.render();
            storage.save(LAST_PROCESSOR, processor.name);
        },

        actualProcessor: ko.observable(),

    };



    /* Thank you: http://stackoverflow.com/questions/5489946/jquery-how-to-wait-for-the-end-of-resize-event-and-only-then-perform-an-ac */
    function resizedw() {
        if (!ui.loading()) {
            app.render();
        }
    }

    var doit;
    window.onresize = function() {
        clearTimeout(doit);
        doit = setTimeout(resizedw, 100);
    };

    function downloadFile(filename, text, type) {
        var element = document.createElement('a');
        element.setAttribute('href', type || 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    /* Loads the last processor and drawer */
    var lastProcessor = storage.load(LAST_PROCESSOR);
    if (lastProcessor) {
        app.actualProcessor(_.findWhere(processors, {
            name: lastProcessor
        }));
    } else {
        app.actualProcessor(processors[0]);
    }

    /* Loads last user who have been loaded */
    convert.init(function() {
        app.preRender();
    });


    // DEBUG
    window.ko = ko;
    window.app = app;

    ko.applyBindings(app, document.getElementById("body"));

    // for testing 
    // if ()
    // setTimeout(app.preRender, 0);

});