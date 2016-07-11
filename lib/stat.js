define([
    'knockout',
    'lib/user',
    'lib/utils/popup',
    'json!node_modules/analyze-facebook-history/emotions.json',
    'text!templates/stat.html',
    'json!lib/utils/colors.json',
    'lib/search',
    'lib/word-cloud'

], function(ko, user, popup, emotions, statTemplate, colors, search, wordCloud) {


    var stat = {
        openUser: function(userId) {
            var stat = user.userActivity()[userId];
            var userMessages = user.messages().filter(function(m) {
                return (m.fromUserId == userId) || (m.toUserId == userId);
            }).sort(function(a, b) {
                if (a.sendDate > b.sendDate) return 1;
                if (a.sendDate < b.sendDate) return -1;
                return 0;
            });
            popup.open({
                loadMessages: ko.observable(false),
                userColor: colors[userId] || 'grey',
                stat: stat,
                messages: userMessages,
                emotions: emotions,
                colors: colors,
                keyword: search.searchKeyword,
                openThread: search.openThread,
                openWordCloud: wordCloud.openWordCloud.bind(this, userMessages)
            }, statTemplate);
        },

    };
    return stat;

});