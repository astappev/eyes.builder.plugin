/** Utils for working with remote webdriver. */
applitools.playbackUtils = {};

var JS_GET_DOCUMENT_READY_STATUS = "return document.readyState";

var JS_GET_USER_AGENT = "return navigator.userAgent";

var JS_GET_DEVICE_PIXEL_RATIO = "return window.devicePixelRatio";

var JS_GET_VIEWPORT_SIZE =
    "var height = undefined; " +
    "var width = undefined; " +
    "if (window.innerHeight) { height = window.innerHeight; } " +
    "else if (document.documentElement && document.documentElement.clientHeight) { height = document.documentElement.clientHeight; } " +
    "else { var b = document.getElementsByTagName('body')[0]; if (b.clientHeight) {height = b.clientHeight;} }; " +
    "if (window.innerWidth) { width = window.innerWidth; } " +
    "else if (document.documentElement && document.documentElement.clientWidth) { width = document.documentElement.clientWidth; } " +
    "else { var b = document.getElementsByTagName('body')[0]; if (b.clientWidth) { width = b.clientWidth;} }; " +
    "return [width, height];";

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

applitools.playbackUtils.getViewportSizeFromRecord = function(r) {
    for (var i = 0, len = r.script.steps.length; i < len; ++i) {
        if (r.script.steps[i].type.name == "setViewportSize") {
            return {
                width: parseInt(r.script.steps[i].width, 10),
                height: parseInt(r.script.steps[i].height, 10)
            }
        }
    }

    return null;
};

applitools.playbackUtils.sleep = function(ms) {
    return applitools.promiseFactory.makePromise(function (resolve) {
        window.setTimeout(function () {
            resolve();
        }, ms);
    });
};

applitools.playbackUtils.executeScript = function(r, script) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        builder.selenium2.rcPlayback.send(r, "POST", "/execute", JSON.stringify({
            'script': script,
            'args': []
        }), function (r, response) {
            resolve(response.value);
        }, function (r, response) {
            reject(response);
        });
    });
};

applitools.playbackUtils.getDocumentReadyStatus = function(r) {
    return applitools.playbackUtils.executeScript(r, JS_GET_DOCUMENT_READY_STATUS);
};

applitools.playbackUtils.getWindowPosition = function(r) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        builder.selenium2.rcPlayback.send(r, "GET", "/window_handle", "", function (r, handle) {
            builder.selenium2.rcPlayback.send(r, "GET", "/window/" + handle.value + "/position", "", function (r, response) {
                resolve({
                    x: response.value.x,
                    y: response.value.y
                });
            }, function (r, response) {
                reject(response);
            });
        });
    });
};

applitools.playbackUtils.setWindowPosition = function(r, point) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        builder.selenium2.rcPlayback.send(r, "GET", "/window_handle", "", function (r, handle) {
            builder.selenium2.rcPlayback.send(r, "POST", "/window/" + handle.value + "/position", JSON.stringify({
                "x": point.x,
                "y": point.y
            }), function () {
                resolve();
            }, function (r, response) {
                reject(response);
            });
        });
    });
};

applitools.playbackUtils.getWindowSize = function(r) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        builder.selenium2.rcPlayback.send(r, "GET", "/window_handle", "", function (r, handle) {
            builder.selenium2.rcPlayback.send(r, "GET", "/window/" + handle.value + "/size", "", function (r, response) {
                resolve({
                    width: response.value.width,
                    height: response.value.height
                });
            }, function (r, response) {
                reject(response);
            });
        });
    });
};

applitools.playbackUtils.setWindowSize = function(r, requiredSize, retries) {
    return applitools.promiseFactory.makePromise(function (resolve) {
        console.info("Trying to set browser size to:", requiredSize);

        builder.selenium2.rcPlayback.send(r, "GET", "/window_handle", "", function(r, handle) {
            builder.selenium2.rcPlayback.send(r, "POST", "/window/" + handle.value + "/size", JSON.stringify({
                "width": requiredSize.width,
                "height": requiredSize.height
            }), function () {
                applitools.playbackUtils.sleep(1000).then(function () {
                    return applitools.playbackUtils.getWindowSize(r);
                }).then(function (currentSize) {
                    console.info("Current browser size:", currentSize, retries);
                    if (currentSize.width === requiredSize.width && currentSize.height === requiredSize.height) {
                        resolve(true);
                        return;
                    }

                    if (retries === 0) {
                        console.log("setWindowSize: retries is out");
                        resolve(false);
                        return;
                    } else if (!retries) {
                        retries = 3;
                    }

                    applitools.playbackUtils.setWindowSize(r, requiredSize, retries - 1).then(function (val) {
                        resolve(val);
                    });
                });
            }, function (r, response) {
                console.log(response);
                resolve(false);
            });
        });
    });
};

applitools.playbackUtils.getViewportSize = function(r) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        return applitools.playbackUtils.executeScript(r, JS_GET_VIEWPORT_SIZE).then(function (results) {
            if (isNaN(results[0]) || isNaN(results[1])) {
                reject("Can't parse values.");
            } else {
                resolve({
                    width: parseInt(results[0], 10) || 0,
                    height: parseInt(results[1], 10) || 0
                });
            }
        }, function (err) {
            reject(err);
        });
    });
};

applitools.playbackUtils.setViewportSize = function(r, requiredSize) {
    // First we will set the window size to the required size.
    // Then we'll check the viewport size and increase the window size accordingly.
    console.info("setViewportSize(", requiredSize, ")");
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        try {
            var actualViewportSize;
            applitools.playbackUtils.getViewportSize(r).then(function (viewportSize) {
                actualViewportSize = viewportSize;
                console.info("Initial viewport size:", actualViewportSize);

                // If the viewport size is already the required size
                if (actualViewportSize.width == requiredSize.width && actualViewportSize.height == requiredSize.height) {
                    resolve();
                    return;
                }

                // We move the window to (0,0) to have the best chance to be able to set the viewport size as requested.
                applitools.playbackUtils.setWindowPosition(r, {x: 0, y: 0}).catch(function () {
                    console.info("Warning: Failed to move the browser window to (0,0)");
                }).then(function () {
                    return applitools.playbackUtils.setBrowserSizeByViewportSize(r, actualViewportSize, requiredSize);
                }).then(function () {
                    return applitools.playbackUtils.getViewportSize(r);
                }).then(function (actualViewportSize) {
                    if (actualViewportSize.width == requiredSize.width && actualViewportSize.height == requiredSize.height) {
                        resolve();
                        return;
                    }

                    // Additional attempt. This Solves the "maximized browser" bug
                    // (border size for maximized browser sometimes different than non-maximized,
                    // so the original browser size calculation is wrong).
                    console.info("Trying workaround for maximization...");
                    return applitools.playbackUtils.setBrowserSizeByViewportSize(r, actualViewportSize, requiredSize).then(function () {
                        return applitools.playbackUtils.getViewportSize(r);
                    }).then(function (viewportSize) {
                        actualViewportSize = viewportSize;
                        console.info("Current viewport size:", actualViewportSize);

                        if (actualViewportSize.width == requiredSize.width && actualViewportSize.height == requiredSize.height) {
                            resolve();
                            return;
                        }

                        return applitools.playbackUtils.getWindowSize(r).then(function (browserSize) {
                            var MAX_DIFF = 3;
                            var widthDiff = actualViewportSize.width - requiredSize.width;
                            var widthStep = widthDiff != 0 ? (widthDiff / (-widthDiff)) : 1; // -1 for smaller size, 1 for larger
                            var heightDiff = actualViewportSize.height - requiredSize.height;
                            var heightStep = heightDiff != 0 ? (heightDiff / (-heightDiff)) : 1;

                            var currWidthChange = 0;
                            var currHeightChange = 0;
                            // We try the zoom workaround only if size difference is reasonable.
                            if (Math.abs(widthDiff) <= MAX_DIFF && Math.abs(heightDiff) <= MAX_DIFF) {
                                console.info("Trying workaround for zoom...");
                                return _setWindowSize(r, requiredSize, actualViewportSize, browserSize, widthDiff, widthStep, heightDiff, heightStep, currWidthChange, currHeightChange).then(function () {
                                    resolve();
                                }, function () {
                                    console.info("Zoom workaround failed.");
                                    reject();
                                });
                            }
                        });
                    });
                });
            }).catch(function () {
                reject("Failed to set viewport size!");
            });
        } catch (err) {
            reject(new Error(err));
        }
    });
};

function _setWindowSize(r, requiredSize, actualViewportSize, browserSize, widthDiff, widthStep, heightDiff, heightStep, currWidthChange, currHeightChange) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        // We specifically use "<=" (and not "<"), so to give an extra resize attempt
        // in addition to reaching the diff, due to floating point issues.
        if (Math.abs(currWidthChange) <= Math.abs(widthDiff) && actualViewportSize.width != requiredSize.width) {
            currWidthChange += widthStep;
        }

        if (Math.abs(currHeightChange) <= Math.abs(heightDiff) && actualViewportSize.height != requiredSize.height) {
            currHeightChange += heightStep;
        }

        var sizeToSet = {
            width: browserSize.width + currWidthChange,
            height: browserSize.height + currHeightChange
        };

        return applitools.playbackUtils.setWindowSize(r, sizeToSet).then(function () {
            return applitools.playbackUtils.getViewportSize(r);
        }).then(function (actualViewportSize) {
            console.info("Current viewport size:", actualViewportSize);
            if (actualViewportSize.width === requiredSize.width && actualViewportSize.height === requiredSize.height) {
                resolve();
                return;
            }

            if (Math.abs(currWidthChange) <= Math.abs(widthDiff) || Math.abs(currHeightChange) <= Math.abs(heightDiff)) {
                return _setWindowSize(r, requiredSize, actualViewportSize, browserSize, widthDiff, widthStep, heightDiff, heightStep, currWidthChange, currHeightChange).then(function () {
                    resolve();
                }, function () {
                    reject();
                });
            }

            reject();
        });
    });
}

applitools.playbackUtils.getViewportSizeOrDisplaySize = function(r) {
    return applitools.playbackUtils.getViewportSize(r).catch(function (err) {
        console.info("Failed to extract viewport size using Javascript:", err);
        console.info("Using window size as viewport size.");
        return applitools.playbackUtils.getWindowSize(r);
    });
};

applitools.playbackUtils.setBrowserSizeByViewportSize = function(r, actualViewportSize, requiredViewportSize) {
    return applitools.playbackUtils.getWindowSize(r).then(function (browserSize) {
        console.info("Current browser size:", browserSize);
        var requiredBrowserSize = {
            width: browserSize.width + (requiredViewportSize.width - actualViewportSize.width),
            height: browserSize.height + (requiredViewportSize.height - actualViewportSize.height)
        };
        return applitools.playbackUtils.setWindowSize(r, requiredBrowserSize);
    });
};

applitools.playbackUtils.getEntirePageSize = function(r) {
    return applitools.playbackUtils.executeScript(r, JS_GET_CONTENT_ENTIRE_SIZE).then(function (result) {
        return {
            width: parseInt(result[0], 10) || 0,
            height: parseInt(result[1], 10) || 0
        }
    });
};

applitools.playbackUtils.getScrollPosition = function(r) {
    return applitools.playbackUtils.executeScript(r, JS_GET_CURRENT_SCROLL_POSITION).then(function (result) {
        return {
            x: parseInt(result[0], 10) || 0,
            y: parseInt(result[1], 10) || 0
        }
    });
};

applitools.playbackUtils.setScrollPosition = function(r, point) {
    var script = 'window.scrollTo(' + parseInt(point.x, 10) + ', ' + parseInt(point.y, 10) + ');';
    return applitools.playbackUtils.executeScript(r, script);
};

applitools.playbackUtils.getUserAgent = function(r) {
    return applitools.playbackUtils.executeScript(r, JS_GET_USER_AGENT);
};

applitools.playbackUtils.getDevicePixelRatio = function(r) {
    return applitools.playbackUtils.executeScript(r, JS_GET_DEVICE_PIXEL_RATIO).then(function (result) {
        return parseFloat(result);
    });
};

applitools.playbackUtils.waitForDocumentReady = function(r, retries) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        applitools.playbackUtils.getDocumentReadyStatus(r).then(function (value) {
            if (value === "complete") {
                resolve();
                return;
            }

            if (retries === 0) {
                reject("waitForDocumentReady: retries is out");
                return;
            } else if (!retries) {
                retries = 3;
            }

            applitools.playbackUtils.sleep(1000).then(function () {
                return applitools.playbackUtils.waitForDocumentReady(r, retries - 1).then(function () {
                    resolve();
                }, function (err) {
                    reject(err);
                });
            });
        });
    });
};

applitools.playbackUtils.takeScreenshot = function(r) {
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
        applitools.playbackUtils.sleep(applitools.WAIT_BEFORE_SCREENSHOT).then(function () {
            builder.selenium2.rcPlayback.send(r, "GET", "/screenshot", "", function (r, response) {
                var mutableImage = new window.EyesImages.MutableImage(response.value, applitools.promiseFactory);
                resolve(mutableImage);
            }, function (r, response) {
                reject(response);
            });
        });
    });
};

applitools.playbackUtils.getRegionByElement = function(r, locator) {
    var elSize, elLocation;
    return applitools.promiseFactory.makePromise(function (resolve, reject) {
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
                }, function (r, response) {
                    reject(response);
                });
            });
        });
    });
};

applitools.playbackUtils.updateScalingParams = function(r) {
    var propertyHandler = new window.EyesImages.SimplePropertyHandler();
    var factory, enSize, vpSize, devicePixelRatio;
    console.log("Trying to extract device pixel ratio...");
    return applitools.playbackUtils.getDevicePixelRatio(r).then(function (ratio) {
        devicePixelRatio = ratio;
    }, function (err) {
        console.log("Failed to extract device pixel ratio! Using default.", err);
        devicePixelRatio = applitools.DEFAULT_DEVICE_PIXEL_RATIO;
    }).then(function () {
        console.log("Device pixel ratio: " + devicePixelRatio);
        console.log("Setting scale provider...");
        return applitools.playbackUtils.getEntirePageSize(r);
    }).then(function (entireSize) {
        enSize = entireSize;
        return applitools.playbackUtils.getViewportSizeOrDisplaySize(r);
    }).then(function (viewportSize) {
        vpSize = viewportSize;
        factory = new window.EyesImages.ContextBasedScaleProviderFactory(enSize, vpSize, devicePixelRatio, propertyHandler);
    }, function (err) {
        console.log("Failed to set ContextBasedScaleProvider.", err);
        console.log("Using FixedScaleProvider instead...");
        factory = new window.EyesImages.FixedScaleProviderFactory(1 / devicePixelRatio, propertyHandler);
    }).then(function () {
        console.log("Done!");
        return factory;
    });
};

applitools.playbackUtils.captureViewport = function(r, scaleProviderFactory) {
    var parsedImage, imageSize, scaleProvider;
    return applitools.playbackUtils.takeScreenshot(r).then(function (image) {
        parsedImage = image;
        return parsedImage.getSize();
    }).then(function (imgSize) {
        imageSize = imgSize;
        scaleProvider = scaleProviderFactory.getScaleProvider(imageSize.width);

        console.log(scaleProvider.getScaleRatio());
        if (scaleProvider && scaleProvider.getScaleRatio() !== 1) {
            return parsedImage.scaleImage(scaleProvider.getScaleRatio());
        }
    }).then(function () {
        return parsedImage;
    });
};

applitools.playbackUtils.getScreenshot = function(r) {
    var scaleProviderFactory, entirePageSize, originalPosition, screenshot;
    return applitools.playbackUtils.updateScalingParams(r).then(function (result) {
        scaleProviderFactory = result;
        return applitools.playbackUtils.getEntirePageSize(r);
    }).then(function (result) {
        entirePageSize = result;
        return applitools.playbackUtils.getScrollPosition(r);
    }).then(function (result) {
        originalPosition = result;
        return applitools.playbackUtils.captureViewport(r, scaleProviderFactory);
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
                height: Math.max(imageObject.height - applitools.MAX_SCROLLBAR_SIZE, applitools.MIN_SCREENSHOT_PART_HEIGHT)
            };

            var screenshotParts = window.EyesImages.GeometryUtils.getSubRegions({
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
                        return applitools.playbackUtils.setScrollPosition(r, partCoords).then(function () {
                            return applitools.playbackUtils.getScrollPosition(r).then(function (position) {
                                currentPosition = position;
                            });
                        }).then(function () {
                            return applitools.playbackUtils.captureViewport(r, scaleProviderFactory);
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
                return window.EyesImages.ImageUtils.stitchImage(entirePageSize, parts, applitools.promiseFactory).then(function (stitchedBuffer) {
                    screenshot = new window.EyesImages.MutableImage(stitchedBuffer, applitools.promiseFactory);
                    resolve2();
                });
            });
        });
    }).then(function () {
        return applitools.playbackUtils.setScrollPosition(r, originalPosition);
    }).then(function () {
        return screenshot;
    });
};
