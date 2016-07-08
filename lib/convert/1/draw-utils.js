define([
    'knockout'


], function(ko) {
    var utils = {
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
    };
    return utils;
});