function eyes(appName, testName, apiKey) {
    this.appName = appName;
    this.testName = testName;

    this.eyes = new window.EyesImages.Eyes();
    this.eyes.setApiKey(apiKey);
    this.eyes.setOs(window.navigator.userAgent);
    this.eyes.setHostingApp("Selenium builder");
    this.eyes.ignoreMismatch = true;
    this.eyesPromise = null;

    /**
     * @param {number} width
     * @param {number} height
     * @return {Promise}
     */
    this.open = function (width, height) {
        this.eyesPromise = this.eyes.open(this.appName, this.testName, {
            width: width,
            height: height
        });

        return this.eyesPromise;
    };

    /**
     * @return {Promise|null}
     */
    this.close = function () {
        if (this.eyesPromise) {
            var promise = this.eyesPromise;
            this.eyesPromise = null;
            return promise.then(function () {
                return this.eyes.close(false);
            }.bind(this), function (err) {
                return this.eyes.abortIfNotClosed();
            }.bind(this));
        }

        return null;
    };

    this.sendImage = function (canvas, title) {
        if (!this.eyesPromise) {
            this.open(canvas.width, canvas.height).then(function () {
                console.log("Eyes session opened")
            }, function (err) {
                console.error("Can't open eyes session:", err)
            });
        }

        return this.eyesPromise.then(function () {
            console.log("Eyes checkImage");
            var imageBuffer = canvasToBuffer(canvas);
            return this.eyes.checkImage(imageBuffer, title, false);
        }.bind(this));
    };

    var canvasToBuffer = function (canvas) {
        var data = canvas.toDataURL('image/png').split(',')[1];
        return new window.Buffer(data, 'base64');
    };

}