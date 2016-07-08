define([
    'knockout',
    'lib/data-loader',
    'lib/ui',
    'json!lib/utils/colors.json'
], function(ko, dataLoader, ui, colors) {
    var user = {
        meta: ko.observable({
            username: 'Dummy Tibor'
        }),
        userActivity: ko.observable(),
        messages: ko.observable(),
        userName: ko.observable(),
        metaData: ko.observable(),
        color: function(userId) {
                return colors[userId] || 'grey';
            }
            // load: function() {
            //     ui.loading(true);
            //     var p1 = dataLoader.loadStatFile().then(function(userData) {
            //         user.stat(userData);
            //     });
            //     var p2 = dataLoader.loadMetaFile().then(function(userMetaData) {
            //         user.meta(userMetaData);
            //         // TODO: convert/extractor exports main username from settings!
            //         user.username(user.meta().userIdMap[user.meta().mainUserId]);
            //     });
            //     $.when(p1, p2).always(function() {
            //         ui.loading(false);
            //     });

        //     return user;
        // }
    };
    user.userName.subscribe(ui.title);
    return user;

});