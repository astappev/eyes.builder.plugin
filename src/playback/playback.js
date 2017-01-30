/* Implementation of new types for rcPlayback */

builder.selenium2.rcPlayback.types['setViewportSize'] = function(r) {
    var requiredSize = {
        "width": parseInt(builder.selenium2.rcPlayback.param(r, "width")),
        "height": parseInt(builder.selenium2.rcPlayback.param(r, "height"))
    };

    return applitools.playbackUtils.setViewportSize(r, requiredSize).then(function () {
        builder.selenium2.rcPlayback.recordResult(r, {'success': true});
    }, function (err) {
        builder.selenium2.rcPlayback.recordError(r, err);
    });
};

builder.selenium2.rcPlayback.types['eyes.checkWindow'] = function (r) {
    var title = builder.selenium2.rcPlayback.param(r, "title");

    beforeAll(r).then(function () {
        var i = 0; // just for updating progress bar
        var imageProvider = createImageProvider(r, function () {
            if (i++ == 0) updateStepProgress(r, 10);
            else if (i == 3) updateStepProgress(r, 55);
        }, function () {
            if (i++ == 1) updateStepProgress(r, 40);
            else if (i == 4) updateStepProgress(r, 85);
        });
        return applitools.checkImage(imageProvider, title);
    }).then(function (result) {
        builder.selenium2.rcPlayback.recordResult(r, {success: !!result.asExpected});
    }, function (err) {
        builder.selenium2.rcPlayback.recordResult(r, {success: false, message: err});
    });
};

builder.selenium2.rcPlayback.types['eyes.checkElement'] = function (r) {
    var title = builder.selenium2.rcPlayback.param(r, "title");
    var locator = builder.selenium2.rcPlayback.param(r, "locator");
    var elRegion;

    beforeAll(r).then(function () {
        return applitools.playbackUtils.getRegionByElement(r, locator);
    }).then(function (region) {
        elRegion = region;
        var i = 0; // just for updating progress bar
        var imageProvider = createImageProvider(r, function () {
            if (i++ == 0) updateStepProgress(r, 10);
            else if (i == 3) updateStepProgress(r, 55);
        }, function () {
            if (i++ == 1) updateStepProgress(r, 40);
            else if (i == 4) updateStepProgress(r, 85);
        });
        return applitools.checkRegion(elRegion, imageProvider, title);
    }).then(function (result) {
        builder.selenium2.rcPlayback.recordResult(r, {success: !!result.asExpected});
    }, function (err) {
        builder.selenium2.rcPlayback.recordResult(r, {success: false, message: err});
    });
};

builder.selenium2.rcPlayback.types['eyes.checkRegion'] = function (r) {
    var title = builder.selenium2.rcPlayback.param(r, "title");
    var region = {
        left: parseInt(builder.selenium2.rcPlayback.param(r, "left"), 10),
        top: parseInt(builder.selenium2.rcPlayback.param(r, "top"), 10),
        width: parseInt(builder.selenium2.rcPlayback.param(r, "width"), 10),
        height: parseInt(builder.selenium2.rcPlayback.param(r, "height"), 10)
    };

    beforeAll(r).then(function () {
        var i = 0; // just for updating progress bar
        var imageProvider = createImageProvider(r, function () {
            if (i++ == 0) updateStepProgress(r, 10);
            else if (i == 3) updateStepProgress(r, 55);
        }, function () {
            if (i++ == 1) updateStepProgress(r, 40);
            else if (i == 4) updateStepProgress(r, 85);
        });
        return applitools.checkRegion(region, imageProvider, title);
    }).then(function (result) {
        builder.selenium2.rcPlayback.recordResult(r, {success: !!result.asExpected});
    }, function (err) {
        builder.selenium2.rcPlayback.recordResult(r, {success: false, message: err});
    });
};



/* Additional helper methods */
function beforeAll(r) {
    var promise = applitools.promiseFactory.makePromise(function (resolve) {
        resolve();
    });

    updateStepProgress(r, 1);

    if (!applitools.getUserAgent()) {
        promise.then(function () {
            applitools.playbackUtils.getUserAgent(r).then(function (newUserAgent) {
                applitools.setUserAgent(newUserAgent);
            });
        });
    }

    return promise.then(function () {
        updateStepProgress(r, 2);

        return applitools.playbackUtils.waitForDocumentReady(r);
    }).then(function () {
        updateStepProgress(r, 5);
    });
}

function updateStepProgress(r, percentage) {
    r.stepStateCallback(r, r.script, r.currentStep, r.currentStepIndex, builder.stepdisplay.state.NO_CHANGE, null, null, percentage);
}

function createImageProvider(r, beforeCallback, afterCallback) {
    return {
        getScreenshot: function () {
            beforeCallback();
            return applitools.playbackUtils.getScreenshot(r).then(function (screenshot) {
                afterCallback();
                return screenshot;
            });
        }
    }
}
