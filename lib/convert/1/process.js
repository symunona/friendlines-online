define([
    'knockout',
    '_'

], function(ko) {

    return process;

    function process(userActivity, filter) {

        var ret = [];

        for (var userId in userActivity) {
            var drawUser = true;
            var user = userActivity[userId];

            /* Check for all minimum keys set in filter */
            drawUser = drawUser && isUserFulfillingMinimumRequirements(user, filter.min);

            /* Check, for minimum active months */
            drawUser = drawUser && (user.sums.activeMonthCount > filter.minActiveMonthCount);
            if (drawUser) {
                ret.push(user);
            }
        }

        var level1 = filter.orderBy.split('.')[0];
        var level2 = filter.orderBy.split('.').length > 1 ? filter.orderBy.split('.')[1] : false;


        ret = ret.sort(function(a, b) {
            var la1 = a[level1] || 0,
                la2 = b[level1] || 0;
            if (level2) {
                la1 = la1[level2] || 0;
                la2 = la2[level2] || 0;
            }

            if (la1 > la2) return 1;
            if (la1 < la2) return -1;
            return 0;
        });

        // console.log(ret.map(function(e) {
        //     return level2 ? e[level1][level2] : e[level1];
        // }));


        if (filter.descendingOrderBy) {
            ret = ret.reverse();
        }

        return ret;
    }



    /**
     * Everything put into the filter.min will be checked
     * if reaching the minimum required value.
     * If not, return false.
     */

    function isUserFulfillingMinimumRequirements(user, minimums) {
        for (var k in minimums) {
            if (user.sums[k] <= minimums[k]) return false;
        }
        return true;
    }


});