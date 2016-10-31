var screenshot = {

    wholePage: function () {
        var contentWindow = bridge.getRecordingWindow().content;
        var contentDocument = contentWindow.document;

        var width = Math.max(contentDocument.documentElement.scrollWidth, contentDocument.body.scrollWidth),
            height = Math.max(contentDocument.documentElement.scrollHeight, contentDocument.body.scrollHeight);

        return this.createCanvas(0, 0, width, height, contentWindow);
    },

    visibleContent: function () {
        var contentWindow = bridge.getRecordingWindow().content;
        var contentDocument = contentWindow.document;

        var x = contentDocument.documentElement.scrollLeft,
            y = contentDocument.documentElement.scrollTop,
            width = contentDocument.documentElement.clientWidth,
            height = contentDocument.documentElement.clientHeight;

        return this.createCanvas(x, y, width, height, contentWindow);
    },

    pageRegion: function (x, y, width, height) {
        var contentWindow = bridge.getRecordingWindow().content;
        return this.createCanvas(x, y, width, height, contentWindow);
    },

    createCanvas: function (x, y, width, height, contentWindow) {
        x = Math.round(x);
        y = Math.round(y);
        width = Math.round(width);
        height = Math.round(height);

        try {
            var canvas = contentWindow.document.createElementNS('http://www.w3.org/1999/xhtml', 'html:canvas');
            canvas.height = height;
            canvas.width = width;

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.drawWindow(contentWindow, x, y, width, height, 'rgb(255,255,255)');

            if (width != canvas.width || height != canvas.height) {
                throw new Error("Size error");
            }

            return {
                'canvas': canvas,
                'ctx': ctx
            };
        } catch(ex) {
            console.error(ex);
            throw new Error('Unable to capture screenshot with\n' +
                'url: ' + contentWindow.location + '\n' +
                'x: ' + x + '\n' +
                'y: ' + y + '\n' +
                'width: ' + width + '\n' +
                'height: ' + height + '\n' +
                'error: ' + ex);
        }
    }
};