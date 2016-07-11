define([
    'knockout',
    'lib/utils/progress',
    'storage',
    'wrap',
    'moment'
], function(ko, progress, storage, wrap, moment) {

    const VISIBILITY_PERMANENT_KEY = 'visibilities';

    var savedVisibilities = storage.load(VISIBILITY_PERMANENT_KEY) || {
        filter: true
    };

    var ui = {
        visible: {
            filter: ko.observable(savedVisibilities.filter),
            users: ko.observable(savedVisibilities.users),
            status: ko.observable(false),
            share: ko.observable(false),
            menu: ko.observable(false)
        },
        _loading: ko.observable(false),
        loading: ko.observable(false),
        status: ko.observable(''),
        statusHistory: ko.observable(''),
        statusIcon: ko.observable(),
        statusColor: ko.observable('#eee'),

        defaultStatusColor: '#eee',
        title: function(windowTitle) {
            document.title = windowTitle;
        },
        progress: progress,

        /**
         * Opens native file browser returns promise.
         */
        openFileDialog: function(extensions) {
            var deferred = $.Deferred();
            var chooser = document.querySelector('#file-dialog');
            chooser.setAttribute("accept", extensions || '*');
            chooser.addEventListener("change", function(evt) {
                if (this.value) {
                    deferred.resolve(this.value, evt.target.files[0]);
                } else
                    deferred.reject();
            }, false);

            chooser.click();
            return deferred;
        }
    };

    ui.status.subscribe(function(value) {
        ui.statusHistory('[' + moment().format() + '] ' + value + '\n');
    });

    ui.stack = function() {
        var err = new Error();
        console.warn(err.stack);
    };

    ui.visible.filter.subscribe(saveVisibilities);
    ui.visible.users.subscribe(saveVisibilities);

    function saveVisibilities() {
        storage.save(VISIBILITY_PERMANENT_KEY, wrap.toJS(ui.visible));
    }

    return ui;

})