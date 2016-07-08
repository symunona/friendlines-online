var u = require('./node_modules/friendlines-convert-utils/convert-utils.js');
var moment = require('moment');


exports.convert = function convert(jsonRaw) {
    return u.userActivityByMonth(jsonRaw);
};