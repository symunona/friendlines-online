define([
    'knockout',
    'jQuery'
], function(ko) {
    var statUrl = '../friendlines-convert-1/test.stat.json';
    var metaUrl = '../friendlines-convert-1/test.meta.json';

    return {
        loadStatFile: function() {
            return $.getJSON(statUrl);
        },
        loadMetaFile: function() {
            return $.getJSON(metaUrl);
        }
    };
});