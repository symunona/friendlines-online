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
    };
    user.userName.subscribe(ui.title);
    return user;

});