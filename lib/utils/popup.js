define([
    'knockout',

], function(ko) {

    var popup = {
        active: ko.observable(false),
        template: ko.observable(''),
        viewModel: ko.observable({}),
        open: function(viewModel, template, onBound) {
            popup.close();

            popup.active(true);
            popup.template(template);
            popup.changeTemplate();
            ko.applyBindings(viewModel, document.getElementById('popup'));

            if (onBound) onBound(document.getElementById('popup'));
        },
        close: function() {
            popup.template('');
            ko.cleanNode($("#popup")[0]);
            popup.active(false);
        },
        changeTemplate: function() {
            $('#popup').html('').append(popup.template());
        }
    };

    // popup.template.subscribe(popup.changeTemplate);

    return popup;


});