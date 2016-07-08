define([
    'knockout',
    'text!templates/share.html',
    'wrap'


], function(ko, shareTemplate, wrap) {

    const WEBSITE = 'http://friendlines.org'

    var vm = {
        uploadModel: ko.observable(newUploadModel()),
        upload: upload,
        openShared: openShared
    };

    ko.components.register('share', {
        viewModel: function(params) {
            return vm;
        },
        template: shareTemplate
    });

    function initPrewiewPan(element) {
        var self = this;
        var pan = svgPanZoom(element, {
            panEnabled: true,
            controlIconsEnabled: false,
            zoomEnabled: true,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: true,
            zoomScaleSensitivity: 0.2,
            minZoom: 0.1,
            maxZoom: 50,
            fit: true,
            contain: true,
            center: true,
            refreshRate: 'auto',
            onZoom: function(newZoom) {
                if (!isNaN(newZoom))
                    vm.uploadModel().zoom(newZoom);

            },
            beforePan: function() {},
            onPan: function(newPan) {
                if (!isNaN(newPan.x) && !isNaN(newPan.y)) {
                    vm.uploadModel().panx(newPan.x);
                    vm.uploadModel().pany(newPan.y);
                }

            }
        });

        // zoom out from it to see the whole
        var bbox = element.getBBox();
        var width = parseFloat(element.attributes.width.value);
        var height = parseFloat(element.attributes.width.value);
        var zoom = 600 / width;
        pan.zoom(zoom);
        pan.pan({
            x: 0,
            y: 10
        });
    }

    return {

        share: function share(context, event) {
            this.ui.visible.share(!this.ui.visible.share());

            this.link('');
            if (this.ui.visible.share()) {
                var filter = wrap.toJS(this.filter.actual);
                vm.uploadModel().filter = JSON.stringify(filter);
                vm.uploadModel().processor = this.actualProcessor().name;
                // generate the svg
                removePersonalData.call(this);
            }
        }
    };

    function upload() {
        if (!validateUpload(vm.uploadModel())) return;

        var data = wrap.toJS(vm.uploadModel());
        var self = this;
        this.ui.status('Uploading image...');
        this.ui.loading(true);

        var bbox = $('#uploadpreview > svg')[0].getBBox();
        var width = bbox.x + bbox.width;
        var height = bbox.y + bbox.height;
        $('#uploadpreview > svg')
            .attr('height', height)
            .attr('width', width)
            .css('transform', 'translate(' + bbox.x + ',' + bbox.y + ')');
        data.svg = $('#uploadpreview > svg')[0].outerHTML;

        $.ajax({
            url: WEBSITE + '/link',
            method: "post",
            data: JSON.stringify(data)
        }).done(function(id) {
            self.link(WEBSITE + '/link/' + id);
            self.ui.status('Upload finished! Your link is: ' + '<a href="' + self.link() + '">' + self.link() + '</a>');
            self.ui.loading(false);
        }).fail(function() {
            self.ui.status('Something went wrong :(');
            self.ui.loading(false);
        });
    }

    function openShared() {
        console.log(this.link());
        // require('nw.gui').Shell.openExternal(this.link());
    }

    // lol, good enouh for the demo: http://9gag.com/gag/apqNxqD
    function validateUpload(formdata) {
        if (!formdata.name()) {
            alert('Please provide at least a name for your image!'); // judo validation
            $('#nameinput').focus();
            return false;
        }
        return true;
    }

    function removePersonalData() {
        var originalSvg = $('#timeline:visible > svg')[0].outerHTML;
        $('#uploadpreview').html('');
        $('#uploadpreview').append(originalSvg);

        // $('#uploadpreview').find('text').remove();
        $('#uploadpreview').find('.axis').remove();
        $('#uploadpreview').find('.mainrect').remove();
        $('#uploadpreview').find('.userBoundingBox').remove();
        initPrewiewPan.call(this, $('#uploadpreview').children()[0]);

    }

    function newUploadModel() {
        return {
            public: ko.observable(true),
            name: ko.observable(''),
            comment: ko.observable(''),
            filter: '',
            zoom: ko.observable(1),
            panx: ko.observable(0),
            pany: ko.observable(0),
            processor: '',
            svg: ''
        };
    }



});