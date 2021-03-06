var JS_GET_CURRENT_SCROLL_POSITION =
    "var doc = document.documentElement; " +
    "var x = window.scrollX || ((window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0)); " +
    "var y = window.scrollY || ((window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)); " +
    "return [x, y];";

var JS_GET_CONTENT_ENTIRE_SIZE =
    "var scrollWidth = document.documentElement.scrollWidth; " +
    "var bodyScrollWidth = document.body.scrollWidth; " +
    "var totalWidth = Math.max(scrollWidth, bodyScrollWidth); " +
    "var clientHeight = document.documentElement.clientHeight; " +
    "var bodyClientHeight = document.body.clientHeight; " +
    "var scrollHeight = document.documentElement.scrollHeight; " +
    "var bodyScrollHeight = document.body.scrollHeight; " +
    "var maxDocElementHeight = Math.max(clientHeight, scrollHeight); " +
    "var maxBodyHeight = Math.max(bodyClientHeight, bodyScrollHeight); " +
    "var totalHeight = Math.max(maxDocElementHeight, maxBodyHeight); " +
    "return [totalWidth, totalHeight];";

builder.selenium2.rcPlayback.types['eyes.checkWindow'] = function (r) {
    var title = builder.selenium2.rcPlayback.param(r, "title");

    playbackUtils.updateProgressStatus(r, 1);
    playbackUtils.getScreenshot(r).then(function (screenshot) {
        playbackUtils.updateProgressStatus(r, 55);
        return screenshot.asObject();
    }).then(function (imageObj) {
        playbackUtils.updateProgressStatus(r, 60);
        bridge.focusRecorderWindow();
        return applitools.checkImage(imageObj.imageBuffer, title);
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

    playbackUtils.updateProgressStatus(r, 1);
    playbackUtils.getRegionByElement(r, locator).then(function (region) {
        elRegion = region;
        playbackUtils.updateProgressStatus(r, 10);
        return playbackUtils.getScreenshot(r);
    }).then(function (screenshot) {
        playbackUtils.updateProgressStatus(r, 55);
        return screenshot.asObject();
    }).then(function (imageObj) {
        playbackUtils.updateProgressStatus(r, 60);
        bridge.focusRecorderWindow();
        return applitools.checkRegion(elRegion, imageObj.imageBuffer, title);
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

    playbackUtils.updateProgressStatus(r, 1);
    playbackUtils.getScreenshot(r).then(function (screenshot) {
        playbackUtils.updateProgressStatus(r, 55);
        return screenshot.asObject();
    }).then(function (imageObj) {
        playbackUtils.updateProgressStatus(r, 60);
        bridge.focusRecorderWindow();
        return applitools.checkRegion(region, imageObj.imageBuffer, title);
    }).then(function (result) {
        builder.selenium2.rcPlayback.recordResult(r, {success: !!result.asExpected});
    }, function (err) {
        builder.selenium2.rcPlayback.recordResult(r, {success: false, message: err});
    });
};

var playbackUtils = {
    updateProgressStatus: function (r, percentage) {
        r.stepStateCallback(r, r.script, r.currentStep, r.currentStepIndex, builder.stepdisplay.state.NO_CHANGE, null, null, percentage);
    },

    getViewportSize: function (r) {
        return applitools.promiseFactory.makePromise(function (resolve) {
            builder.selenium2.rcPlayback.send(r, "GET", "/window_handle", "", function (r, handle) {
                builder.selenium2.rcPlayback.send(r, "GET", "/window/" + handle + "/size", "", function (r, response) {
                    resolve({
                        width: response.value.width,
                        height: response.value.height
                    });
                });
            });
        });
    },

    getEntirePageSize: function (r) {
        return this.executeScript(r, JS_GET_CONTENT_ENTIRE_SIZE).then(function (result) {
            return {
                width: parseInt(result[0], 10) || 0,
                height: parseInt(result[1], 10) || 0
            }
        });
    },

    getScrollPosition: function (r) {
        return this.executeScript(r, JS_GET_CURRENT_SCROLL_POSITION).then(function (result) {
            return {
                x: parseInt(result[0], 10) || 0,
                y: parseInt(result[1], 10) || 0
            }
        });
    },

    setScrollPosition: function (r, point) {
        return this.executeScript(r, 'window.scrollTo(' + parseInt(point.x, 10) + ', ' + parseInt(point.y, 10) + ');');
    },

    executeScript: function (r, script) {
        return applitools.promiseFactory.makePromise(function (resolve) {
            builder.selenium2.rcPlayback.send(r, "POST", "/execute", JSON.stringify({
                'script': script,
                'args': []
            }), function (r, response) {
                resolve(response.value);
            });
        });
    },

    getRegionByElement: function (r, locator) {
        var elSize, elLocation;
        return applitools.promiseFactory.makePromise(function (resolve) {
            builder.selenium2.rcPlayback.findElement(r, locator, function(r, id) {
                builder.selenium2.rcPlayback.send(r, "GET", "/element/" + id + "/size", "", function (r, response) {
                    elSize = response.value;
                    builder.selenium2.rcPlayback.send(r, "GET", "/element/" + id + "/location", "", function (r, response) {
                        elLocation = response.value;
                        resolve({
                            left: elLocation.x,
                            top: elLocation.y,
                            width: elSize.width,
                            height: elSize.height
                        });
                    });
                });
            });
        });
    },

    takeScreenshot: function (r) {
        return applitools.promiseFactory.makePromise(function (resolve) {
            builder.selenium2.rcPlayback.send(r, "GET", "/screenshot", "", function (r, response) {
                var imageBuffer = new window.Buffer(response.value, 'base64');
                var mutableImage = new window.EyesUtils.MutableImage(imageBuffer, applitools.promiseFactory);
                resolve(mutableImage);
            });
        });
    },

    getScreenshot: function (r) {
        var that = this;
        return applitools.promiseFactory.makePromise(function (resolve) {
            var entirePageSize, viewportSize, originalPosition, screenshot;
            return that.getViewportSize(r).then(function (result) {
                viewportSize = result;
                return that.getEntirePageSize(r);
            }).then(function (result) {
                entirePageSize = result;
                return that.getScrollPosition(r);
            }).then(function (result) {
                originalPosition = result;
                return that.takeScreenshot(r);
            }).then(function (image) {
                screenshot = image;
                return image.asObject();
            }).then(function (imageObject) {
                return applitools.promiseFactory.makePromise(function (resolve2) {
                    if (imageObject.width >= entirePageSize.width && imageObject.height >= entirePageSize.height) {
                        resolve2();
                        return;
                    }

                    var screenshotPartSize = {
                        width: imageObject.width,
                        height: Math.max(imageObject.height - 50, 10)
                    };

                    var screenshotParts = window.EyesUtils.GeometryUtils.getSubRegions({
                        left: 0, top: 0, width: entirePageSize.width,
                        height: entirePageSize.height
                    }, screenshotPartSize, false);

                    var parts = [];
                    var promise = applitools.promiseFactory.makePromise(function (resolve3) {
                        resolve3();
                    });

                    screenshotParts.forEach(function (part) {
                        promise = promise.then(function () {
                            return applitools.promiseFactory.makePromise(function (resolve4) {
                                if (part.left == 0 && part.top == 0) {
                                    parts.push({
                                        image: imageObject.imageBuffer,
                                        size: {width: imageObject.width, height: imageObject.height},
                                        position: {x: 0, y: 0}
                                    });

                                    resolve4();
                                    return;
                                }

                                var currentPosition;
                                var partCoords = {x: part.left, y: part.top};
                                return that.setScrollPosition(r, partCoords).then(function () {
                                    return that.getScrollPosition(r).then(function (position) {
                                        currentPosition = position;
                                    });
                                }).then(function () {
                                    return that.takeScreenshot(r);
                                }).then(function (partImage) {
                                    return partImage.asObject().then(function (newImageObjects) {
                                        parts.push({
                                            image: newImageObjects.imageBuffer,
                                            size: {width: newImageObjects.width, height: newImageObjects.height},
                                            position: {x: currentPosition.x, y: currentPosition.y}
                                        });

                                        resolve4();
                                    });
                                });
                            });
                        });
                    });

                    return promise.then(function () {
                        return window.EyesUtils.ImageUtils.stitchImage(entirePageSize, parts, applitools.promiseFactory).then(function (stitchedBuffer) {
                            screenshot = new window.EyesUtils.MutableImage(stitchedBuffer, applitools.promiseFactory);
                            resolve2();
                        });
                    });
                });
            }).then(function () {
                return that.setScrollPosition(r, applitools.promiseFactory, originalPosition);
            }).then(function () {
                resolve(screenshot);
            });
        });
    }
};
