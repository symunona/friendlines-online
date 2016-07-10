define([
    'knockout',
    'lib/utils/progress',
    'storage',
    'wrap'
], function(ko, progress, storage, wrap) {

    const VISIBILITY_PERMANENT_KEY = 'visibilities';

    var nwgui = undefined; // require('nw.gui'); // TOOD

    var savedVisibilities = storage.load(VISIBILITY_PERMANENT_KEY) || {};

    var ui = {
        visible: {
            filter: ko.observable(savedVisibilities.filter),
            users: ko.observable(savedVisibilities.users),
            status: ko.observable(false),
            share: ko.observable(false),
            menu: ko.observable(false)
        },
        // filterVisible: ko.observable(false),
        // usersVisible: ko.observable(false),
        // statusVisible: ko.observable(false),
        // shareVisible: ko.observable(false),
        // menuVisible: ko.observable(false),
        _loading: ko.observable(false),
        loading: ko.observable(false),
        status: ko.observable(''),
        statusIcon: ko.observable(),
        statusColor: ko.observable('#eee'),
        defaultStatusColor: '#eee',
        title: function(windowTitle) {
            document.title = windowTitle;
            // nwgui.Window.get().title = 'Friendlines - ' + windowTitle;
        },

        progress: progress,
        openFileDialog: function(extension) {
            var deferred = $.Deferred();
            var chooser = document.querySelector('#file-dialog');
            chooser.setAttribute("accept", extension || '*');
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

    ui.stack = function() {
        var err = new Error();
        console.warn(err.stack);
    };

    // ui.loading.subscribe(function(val) {
    //     if (!val) {
    //         ui.stack();
    //     }
    // });

    ui.visible.filter.subscribe(saveVisibilities);
    ui.visible.users.subscribe(saveVisibilities);

    function saveVisibilities() {
        storage.save(VISIBILITY_PERMANENT_KEY, wrap.toJS(ui.visible));
    }

    return ui;

})