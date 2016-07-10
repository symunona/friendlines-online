(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'lib/convert/convert-utils'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('node_modules/friendlines-convert-utils/convert-utils'));
    } else {
        // Browser globals
        factory((root.commonJsStrict = {}), root.b);
    }
}(this, function(exports, convertUtils) {

    /* The first type of conversion simply is the monthly activity sums. */

    exports.convert = function convert(jsonRaw, ticker) {
        return convertUtils.userActivityByMonth(jsonRaw, ticker);
    };

}));