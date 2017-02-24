applitools.EyesPlayback = function (r, serverUrl, promiseFactory) {
    this._record = r;
    this._callbackBefore = null;
    this._callbackAfter = null;

    window.EyesImages.Eyes.call(this, serverUrl, false, promiseFactory);
};

applitools.EyesPlayback.prototype = Object.create(window.EyesImages.Eyes.prototype);
applitools.EyesPlayback.prototype.constructor = applitools.EyesPlayback;

applitools.EyesPlayback.prototype.checkImage = function (tag, region, ignoreMismatch, retryTimeout) {
    var regionProvider = null;
    if (region) {
        regionProvider = new window.EyesImages.RegionProvider(region, window.EyesImages.CoordinatesType.CONTEXT_AS_IS);
    }
    return this._checkImage(null, tag, ignoreMismatch, retryTimeout, regionProvider);
};

applitools.EyesPlayback.prototype.getScreenShot = function () {
    var that = this;
    if (typeof this._callbackBefore == 'function') {
        this._callbackBefore();
    }

    return applitools.playbackUtils.getScreenshot(that._record).then(function (screenshot) {
        if (typeof that._callbackAfter == 'function') {
            that._callbackAfter();
        }

        return screenshot;
    });
};

applitools.EyesPlayback.prototype.setCallbacks = function (callbackBefore, callbackAfter) {
    this._callbackBefore = callbackBefore;
    this._callbackAfter = callbackAfter;
};

applitools.EyesPlayback.prototype.getViewportSize = function () {
    return applitools.playbackUtils.getViewportSizeOrDisplaySize(this._record);
};

applitools.EyesPlayback.prototype.setViewportSize = function (size) {
    return applitools.playbackUtils.setViewportSize(this._record, size);
};
