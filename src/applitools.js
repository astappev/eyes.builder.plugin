var applitools = {
    apiKey: null,
    serverUrl: null,

    appName: null,
    testName: null,
    matchLevel: null,

    DEFAULT_DEVICE_PIXEL_RATIO: 1,
    MIN_SCREENSHOT_PART_HEIGHT: 10,
    MAX_SCROLLBAR_SIZE: 50,
    WAIT_BEFORE_SCREENSHOT: 100, // ms

    eyes: null,
    promiseFactory: null,
    customTypes: {
        "setViewportSize": {
            "params": ["width", "height"],
            "docs": {
                "params": {
                    "width": "The new viewport width, in pixels.",
                    "height": "The new viewport height, in pixels."
                },
                "description": "Changes the size of the playback viewport."
            }
        },
        "eyes.checkWindow": {
            "params": ["title"],
            "docs": {
                "params": {
                    "title": "Tag for image."
                },
                "description": "Capture full screen of the page."
            }
        },
        "eyes.checkElement": {
            "params": ["locator", "title"],
            "docs": {
                "params": {
                    "locator": "How to find the element to be checked.",
                    "title": "Tag for image."
                },
                "description": "Capture screen of the element."
            }
        },
        "eyes.checkRegion": {
            "params": ["top", "left", "width", "height", "title"],
            "docs": {
                "params": {
                    "top": "Top offset of the selected region.",
                    "left": "Left offset of the selected region.",
                    "width": "Width of the selected region.",
                    "height": "Height of the selected region.",
                    "title": "Tag for image."
                },
                "description": "Capture screen of region on the page."
            }
        }
    },

    init: function () {
        var items = [];
        for (var n in this.customTypes) {
            if (this.customTypes.hasOwnProperty(n)) {
                builder.selenium2.__stepData[n] = this.customTypes[n].params;
                builder.selenium2.docs[n] = this.customTypes[n].docs;

                builder.selenium2.stepTypes[n] = new builder.selenium2.StepType(n);
                items.push(builder.selenium2.stepTypes[n]);
            }
        }

        builder.selenium2.categories.push([_t('__applitools'), items]);
        builder.selenium2.__stepNotes["setViewportSize"] = 'sel2_must_playback_in_foreground';

        this.promiseFactory = new window.EyesImages.PromiseFactory(function (asyncAction) {
            var deferred = jQuery.Deferred();
            asyncAction(deferred.resolve, deferred.reject);
            return deferred;
        }, function () {
            return jQuery.Deferred();
        });
    },

    shutdown: function () {
    },

    getApiKey: function(useDefaultIfNotSpecified) {
        if (!this.apiKey) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.apiKey", defaultVal = null;
            try {
                this.apiKey = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : defaultVal;
            } catch (e) {
                this.apiKey = defaultVal;
            }
        }

        if (!this.apiKey && useDefaultIfNotSpecified) {
            return "<YOUR_API_KEY>";
        }

        return this.apiKey;
    },

    setApiKey: function(newApiKey) {
        var prefName = "extensions.seleniumbuilder.plugins.applitools.apiKey";
        try {
            this.apiKey = newApiKey;
            bridge.prefManager.setCharPref(prefName, this.apiKey);
            return true;
        } catch (e) {
            console.error("Can't save apiKey", e);
        }
    },

    getDefaultServerUrl: function () {
        return "https://eyesapi.applitools.com";
    },

    getServerUrl: function() {
        if (!this.serverUrl) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.serverUrl", defaultVal = null;
            try {
                this.serverUrl = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : defaultVal;
            } catch (e) {
                this.serverUrl = defaultVal;
            }
        }

        return this.serverUrl;
    },

    setServerUrl: function(newServerUrl) {
        var prefName = "extensions.seleniumbuilder.plugins.applitools.serverUrl";
        try {
            this.serverUrl = newServerUrl;
            bridge.prefManager.setCharPref(prefName, this.serverUrl);
        } catch (e) {
            console.error("Can't save serverUrl", e);
        }
    },

    getDefaultAppName: function () {
        return bridge.getRecordingWindow().location.hostname;
    },

    getAppName: function (useDefaultIfNotSpecified) {
        if (!this.appName && useDefaultIfNotSpecified) {
            return this.getDefaultAppName();
        }

        return this.appName;
    },

    setAppName: function (newAppName) {
        this.appName = newAppName;
    },

    getDefaultTestName: function () {
        // return bridge.getRecordingWindow().location.pathname;
        return '';
    },

    getTestName: function (useDefaultIfNotSpecified) {
        if (!this.testName && useDefaultIfNotSpecified) {
            return this.getDefaultTestName();
        }

        return this.testName;
    },

    setTestName: function (newTestName) {
        this.testName = newTestName;
    },

    getAvailableMatchLevels: function () {
        return window.EyesImages.MatchLevel;
    },

    getMatchLevel: function (useDefaultIfNotSpecified) {
        if (!this.matchLevel && useDefaultIfNotSpecified) {
            return window.EyesImages.MatchLevel.Strict;
        }

        return this.matchLevel;
    },

    setMatchLevel: function (newMatchLevel) {
        this.matchLevel = newMatchLevel;
    },

    saveVariableToCurrentScript: function (varName, varValue) {
        var script = builder.suite.getCurrentScript();
        if (script) {
            if (varValue) {
                script.data[varName] = varValue;
            } else {
                delete script.data[varName];
            }
        }
    },

    getRecWinTitle: function () {
        return bridge.getRecordingWindow().document.title;
    },

    getRecWinViewportSize: function () {
        var recWindow = bridge.getRecordingWindow().window;
        var recDocument = bridge.getRecordingWindow().document;
        var height = undefined, width = undefined, body;
        if (recWindow.innerHeight) {
            height = recWindow.innerHeight;
        } else if (recDocument.documentElement && recDocument.documentElement.clientHeight) {
            height = recDocument.documentElement.clientHeight;
        } else {
            body = recDocument.getElementsByTagName('body')[0];
            if (body.clientHeight) {
                height = body.clientHeight;
            }
        }

        if (recWindow.innerWidth) {
            width = recWindow.innerWidth;
        } else if (recDocument.documentElement && recDocument.documentElement.clientWidth) {
            width = recDocument.documentElement.clientWidth;
        } else {
            body = recDocument.getElementsByTagName('body')[0];
            if (body.clientWidth) {
                width = body.clientWidth;
            }
        }

        return {
            width: width,
            height: height
        };
    },

    validateWindow: function () {
        var title = applitools.getRecWinTitle();
        var checkWindowStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkWindow"], title);
        builder.record.recordStep(checkWindowStep);
    },

    validateElement: function () {
        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            applitools.interface.applitoolsPanel.showRecordPanel();
            bridge.focusRecordingTab();
            applitools.interface.notificationBox.show(_t('__applitools_check_element_notification_message'));
            builder.record.verifyExplorer = new builder.VerifyExplorer(
                bridge.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(locator) {
                    // Don't immediately stop: this would cause the listener that prevents the click from
                    // actually activating the selected element to be detached prematurely.
                    setTimeout(function() {
                        builder.record.stopVerifyExploring();
                        applitools.interface.notificationBox.hide();
                    }, 1);

                    bridge.focusRecorderWindow();
                    var title = applitools.getRecWinTitle();
                    var checkElementStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkElement"], locator, title);
                    builder.record.recordStep(checkElementStep);
                },
                true
            );
        }
    },

    validateRegion: function () {
        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            applitools.interface.applitoolsPanel.showRecordPanel();
            bridge.focusRecordingTab();
            applitools.interface.notificationBox.show(_t('__applitools_check_region_notification_message'));
            builder.record.verifyExplorer = new applitools.SelectExplorer(
                bridge.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(region) {
                    // Don't immediately stop: this would cause the listener that prevents the click from
                    // actually activating the selected element to be detached prematurely.
                    setTimeout(function() {
                        builder.record.stopVerifyExploring();
                        applitools.interface.notificationBox.hide();
                    }, 1);

                    bridge.focusRecorderWindow();
                    var title = applitools.getRecWinTitle();
                    var checkRegionStep = new builder.Step(
                        builder.selenium2.stepTypes["eyes.checkRegion"],
                        region.top.toString(),
                        region.left.toString(),
                        region.width.toString(),
                        region.height.toString(),
                        title
                    );
                    builder.record.recordStep(checkRegionStep);
                }
            );
        }
    },

    getSession: function (r) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            var apiKey = that.getApiKey();
            if (!apiKey) {
                reject("API key is empty!");
                return;
            }

            if (!that.eyes) {
                that.eyes = new window.EyesImages.Eyes(that.getServerUrl(), false, that.promiseFactory);
                that.eyes.setApiKey(apiKey);
                that.eyes.setInferredEnvironment("useragent:" + r.vars.userAgent);
                var imageMatch = new window.EyesImages.ImageMatchSettings(that.getMatchLevel(true));
                that.eyes.setDefaultMatchSettings(imageMatch);
            }

            if (!that.eyes.isOpen()) {
                var appName = that.getAppName(true);
                var testName = that.getTestName(true);
                var viewportSize = applitools.playbackUtils.getViewportSizeFromRecord(r);
                if (r == null) {
                    console.log("Error getting viewportSize from steps, using from recording window.");
                    viewportSize = that.getRecWinViewportSize();
                }

                console.log("Opening new session...", appName, testName);
                that.eyes.open(appName, testName, viewportSize).then(function () {
                    console.log("Eyes: new session opened.");
                    resolve();
                }, function (err) {
                    reject("Can't open session:" + err);
                });
            } else {
                resolve();
            }
        });
    },

    checkImage: function (r, imageProvider, title) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            return that.getSession(r).then(function () {
                console.log("Eyes: checking image...");
                return that.eyes.checkImage(imageProvider, title).then(function (result) {
                    console.log("Eyes: check image - done.");
                    resolve(result);
                }, function (err) {
                    console.error("Eyes: error during checkImage:", err);
                    reject(err);
                });
            }, function (err) {
                console.error("Eyes: can't get session:", err);
                reject(err);
            });
        });
    },

    checkRegion: function (r, region, imageProvider, title) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            return that.getSession(r).then(function () {
                console.log("Eyes: checking region...");
                return that.eyes.checkRegion(region, imageProvider, title).then(function (result) {
                    console.log("Eyes: check region - done.");
                    resolve(result);
                }, function (err) {
                    console.error("Eyes: error during checkRegion:", err);
                    reject(err);
                });
            }, function (err) {
                console.error("Eyes: can't get session:", err);
                reject(err);
            });
        });
    },

    closeSession: function () {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            if (!(that.eyes && that.eyes.isOpen())) {
                resolve();
                return;
            }

            return that.getSession().then(function () {
                console.log("Eyes: closing session...");
                return that.eyes.close(false);
            }, function () {
                return that.eyes.abortIfNotClosed();
            }).then(function (data) {
                console.log("Eyes: session closed.");
                applitools.interface.processTestResult(data);
                resolve(data);
            }, function (err) {
                console.error("Eyes: can't close session:", err);
                reject(err);
            }).then(function () {
                that.eyes = null;
            });
        });
    },

    forceCloseSession: function () {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            if (!that.eyes) {
                resolve();
                return;
            }

            console.log("Eyes: aborting session...");
            return that.eyes.abortIfNotClosed().then(function (data) {
                console.log("Eyes: session aborted.");
                applitools.interface.processTestResult(data);
                resolve(data);
            }, function (err) {
                console.error("Eyes: can't abort session:", err);
                reject(err);
            }).then(function () {
                that.eyes = null;
            });
        });
    }
};