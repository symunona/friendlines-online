define([
    'knockout',
    'text!templates/filter.1.html',
    'text!templates/userfilter.html',
    'lib/user',
    'wrap',
    'storage',
    '_'


], function(ko, filter1Template, userFilterTemplate, user, wrap, store) {

    const LAST_FILTER_KEY = 'lastFilter';

    var defaultFilter = {
        name: 'default',
        orderBy: 'firstMessageDate',
        descendingOrderBy: true,
        min: {
            count: 10,
            length: 100
        },
        minActiveMonthCount: 3,
        userFilter: {},
        editable: true
    };

    var filter = {
        actual: ko.observable(wrap.fromJS(defaultFilter)),
        actualRenderableUserList: ko.observableArray(),
        actualRenderableUserListArray: function() {
            if (!filter.userFilter()) return filter.actualRenderableUserList();
            return filter.actualRenderableUserList().filter(function(user) {
                return user.userName.toLowerCase().indexOf(filter.userFilter().toLowerCase()) > -1;
            });
            // return _.sortBy(filter.actualRenderableUserList(), 'userName');
        },
        userToRenderMap: {},
        usersToRender: function() {
            return _.values(filter.actualRenderableUserList())
                .filter(function(userObject) {
                    return filter.userToRenderMap[userObject.id]();
                });
        },
        userFilter: ko.observable(),
        /* Search for the last month to render */
        getFirstAndLastMonthKey: function(userList) {
            var ret = {
                firstMonthKey: undefined,
                lastMonthKey: undefined
            };
            for (var userId in userList) {

                var user = userList[userId];

                if (!ret.firstMonthKey) {
                    ret.firstMonthKey = user.firstMonthKey;
                    ret.lastMonthKey = user.lastMonthKey;
                }
                if (user.lastMonthKey > ret.lastMonthKey) ret.lastMonthKey = user.lastMonthKey;
                if (user.firstMonthKey < ret.firstMonthKey) ret.firstMonthKey = user.firstMonthKey;
            }
            return ret;
        },

        consts: {
            orderBys: ['firstMessageDate',
                    'lastMessageDate',
                    'userName',
                    'sums.count',
                    'sums.length',
                    'sums.happy',
                    'sums.sad',
                    'sums.sceptical',
                    'sums.angry',
                    'sums.horror',
                    'sums.surprised',
                    'sums.playful',
                    'sums.evil',
                    'inbound.happy',
                    'outbound.happy'

                ]
                .map(function(e) {
                    return {
                        name: e,
                        val: e
                    };
                })
        },

        saveAs: function saveFilter() {

            var name = prompt("Enter a name for the filter");
            filter = $.extend(true, {}, getFilter(), {
                name: name
            });
            filters.push(filter);
        },

        save: function() {
            var filterToSave = wrap.toJS(filter.actual());
            store.save(LAST_FILTER_KEY, filterToSave);
        },
        loadLast: function() {
            var lastFilter = store.load(LAST_FILTER_KEY);
            if (!lastFilter) return;
            filter.actual(wrap.fromJS(lastFilter));
        },

        editable: function() {
            return true;
        }
    };

    filter.loadLast();


    /**
     * Extend the userToRenderMap with the renderable
     * users, if they do not exist in the map. 
     */
    filter.actualRenderableUserList.subscribe(function(renderableUsers) {
        for (var i = 0; i < renderableUsers.length; i++) {
            var userId = renderableUsers[i].id;
            if (filter.userToRenderMap[userId] === undefined) {
                filter.userToRenderMap[userId] = ko.observable(true);
            }
        }
    });


    /** Register the filter components */

    ko.components.register('filter', {
        viewModel: function(params) {
            $.extend(this, filter);
            return filter;
        },
        template: filter1Template
    });

    ko.components.register('userfilter', {
        viewModel: function(params) {
            return {
                actualRenderableUserList: filter.actualRenderableUserList,
                actualRenderableUserListArray: filter.actualRenderableUserListArray,
                user: user,
                selectAll: function(bool) {
                    Object.keys(filter.userToRenderMap).map(function(userId) {
                        filter.userToRenderMap[userId](bool);
                    });
                },
                invert: function() {
                    Object.keys(filter.userToRenderMap).map(function(userId) {
                        filter.userToRenderMap[userId](!filter.userToRenderMap[userId]());
                    });
                },
                userFilter: filter.userFilter,
                userToRenderMap: filter.userToRenderMap,
                isIn: function(id) {
                    return filter.userToRenderMap[id]();
                },
                color: user.color,
            };
        },
        template: userFilterTemplate
    });


    return filter;

});