define([
    'knockout',
    'wrap'
], function(ko, wrap) {
    var storage = {
        save: function(key, object) {
            localStorage.setItem(key, JSON.stringify(wrap.toJS(object)));
        },
        load: function(key) {
            var item = localStorage.getItem(key);
            return item ? JSON.parse(item) : undefined;
        },
        remove: function(key) {
            localStorage.removeItem(key);
        },
        exists: function(key) {
            return !!localStorage.getItem(key);
        }
    };
    return storage;
});