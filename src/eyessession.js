applitools.EyesSession = function (appName, testName, viewportSize, apiKey) {
    this.appName = appName;
    this.testName = testName;
    this.viewportSize = viewportSize;

    this.EyesImages = new window.EyesImages.Eyes();
    this.EyesImages.setApiKey(apiKey);
    this.EyesImages.setInferredEnvironment("useragent:" + window.navigator.userAgent);
    this.EyesImages.setHostingApp("Selenium builder");
    this.EyesImages.ignoreMismatch = true;
    this.eyesPromise = null;

    this.isOpen = false;
    this.isClosed = false;
};

applitools.EyesSession.prototype = {
    /**
     * @return {Promise}
     */
    getSession: function () {
        var that = this;
        if (!this.eyesPromise) {
            this.eyesPromise = that.EyesImages.open(this.appName, this.testName, this.viewportSize).then(function () {
                that.isOpen = true;
                console.log("Eyes session opened")
            }, function (err) {
                console.error("Can't open eyes session:", err)
            });
        }

        return this.eyesPromise;
    },

    /**
     * @return {Promise|null}
     */
    close: function () {
        var that = this;
        if (this.isOpen) {
            return this.eyesPromise.then(function () {
                that.isClosed = true;
                that.isOpen = false;
                return that.EyesImages.close(false);
            }, function (err) {
                that.isOpen = false;
                return that.EyesImages.abortIfNotClosed();
            });
        }

        return null;
    },

    sendImage: function (canvas, title) {
        var that = this;
        if (!this.isClosed) {
            return this.getSession().then(function () {
                console.log("Eyes checkImage");
                var data = canvas.toDataURL('image/png').split(',')[1];
                var imageBuffer = new window.Buffer(data, 'base64');
                return that.EyesImages.checkImage(imageBuffer, title, false);
            });
        }

        return null;
    }
};
