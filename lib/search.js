define([
    'knockout',
    'lib/user',
    'lib/utils/popup',
    'text!templates/search-results.html',
    'json!lib/utils/colors.json',
    'lib/word-cloud'

], function(ko, user, popup, searchResultTemplate, colors, wordCloud) {
    var search = {
        openSearchResult: function() {
            app.actualProcessor().draw.showSearchResults(search.searchResult());
            popup.open({
                threadId: false,
                colors: colors,
                messages: search.searchResult,
                keyword: search.searchKeyword,
                openUser: search.openUser,
                isMainUser: search.isMainUser,
                openThread: search.openThread,
                openWordCloud: wordCloud.openWordCloud.bind(this, search.searchResult())

            }, searchResultTemplate);
        },
        openUser: function(id) {
            if (!search.isMainUser(id))
                app.stat.openUser(id);
        },
        isMainUser: function(id) {
            return user.metaData().mainUserId == id;
        },
        status: ko.observable(),
        searchKeyword: ko.observable(),
        searchResult: ko.observableArray(),
        searchByKeyword: function() {
            search.searchResult(searchByKeyword());
        },
        openThread: function(message) {
            var thread = user.messages().filter(function(m) {
                return m.threadId == message.threadId;
            }).sort(function(a, b) {
                if (a.sendDate > b.sendDate) return 1;
                if (a.sendDate < b.sendDate) return -1;
                return 0;
            });
            popup.open({
                threadId: message.threadId,
                colors: colors,
                messages: thread,
                keyword: search.searchKeyword,
                openUser: search.openUser,
                isMainUser: search.isMainUser,
                openThread: search.openThread,
                openWordCloud: wordCloud.openWordCloud.bind(this, thread)
            }, searchResultTemplate);

        },
        searchKeyDown: function(context, event) {
            if (event.keyCode == 13) {
                if ($(event.target).val().length < 2) {
                    app.ui.status('Please specify at least 2 character long search string!');
                    app.actualProcessor().draw.showSearchResults([]);
                    search.searchResult([]);
                    search.status('');
                    return;
                }
                search.searchKeyword($(event.target).val());
                search.searchResult(_.sortBy(searchByKeyword(search.searchKeyword()), 'sendDate'));
                search.status('Results: ' + search.searchResult().length);
                search.openSearchResult();
            }
            return true;
        }

    };

    ko.bindingHandlers.highlight = {
        update: function(element, valueAccessor) {
            var options = valueAccessor();
            var value = ko.utils.unwrapObservable(options.text);
            var search = ko.utils.unwrapObservable(options.highlight);

            var css = ko.utils.unwrapObservable(options.css) || 'highlight';
            var replacement = '<span class="' + css + '">' + search + '</span>';
            if (!search)
                element.innerHTML = value;
            else
                element.innerHTML = value.replace(new RegExp(search, 'g'), replacement);
        }
    };

    return search;

    function searchByKeyword(keyword) {
        return user.messages().filter(function(message) {
            if (message.message.indexOf(keyword) > -1) {
                return true;
            }
            return false;
        })
    }
})