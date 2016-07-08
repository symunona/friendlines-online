define([
    'knockout',
    'text!templates/header.html',
    'text!templates/error.html',
    'text!templates/status.html',
], function(ko, headerTemplate, errorTemplate, statusTemplate) {

    var templates = {};

    templates.error = errorTemplate;
    templates.header = headerTemplate;
    templates.status = statusTemplate;

    /* Source: http://www.knockmeout.net/2011/10/ko-13-preview-part-3-template-sources.html */

    ko.templateSources.stringTemplate = function(template, templates) {
        this.templateName = template;
        this.templates = templates;
    };

    ko.utils.extend(ko.templateSources.stringTemplate.prototype, {
        data: function(key, value) {
            // console.log("data", key, value, this.templateName);
            this.templates._data = this.templates._data || {};
            this.templates._data[this.templateName] = this.templates._data[this.templateName] || {};

            if (arguments.length === 1) {
                return this.templates._data[this.templateName][key];
            }

            this.templates._data[this.templateName][key] = value;
        },
        text: function(value) {
            // console.log("text", value, this.templateName)
            if (arguments.length === 0) {
                return this.templates[this.templateName];
            }
            this.templates[this.templateName] = value;
        }
    });

    //modify an existing templateEngine to work with string templates
    function createStringTemplateEngine(templateEngine, templates) {
        templateEngine.makeTemplateSource = function(template) {
            return new ko.templateSources.stringTemplate(template, templates);
        };
        return templateEngine;
    }
    ko.setTemplateEngine(createStringTemplateEngine(
        new ko.nativeTemplateEngine(), templates));

    return templates;

});