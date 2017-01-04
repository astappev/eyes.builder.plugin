var applitools = {
    apiKey: null,
    appName: null,
    testName: null,
    isSendOnRecording: null,

    eyes: null,
    eyesPromise: null,
    promiseFactory: null,
    customTypes: {
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

        this.promiseFactory = new window.EyesUtils.PromiseFactory(function (asyncAction) {
            return new window.RSVP.Promise(asyncAction);
        }, function () {
            return window.RSVP.defer();
        });
    },

    shutdown: function () {
    },

    getApiKey: function() {
        if (!this.apiKey) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.apiKey", defaultVal = null;
            try {
                this.apiKey = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : defaultVal;
            } catch (e) {
                this.apiKey = defaultVal;
            }
        }

        return this.apiKey;
    },

    setApiKey: function(newApiKey) {
        if (typeof(newApiKey) === 'string' && newApiKey.length > 0) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.apiKey";
            try {
                this.apiKey = newApiKey;
                bridge.prefManager.setCharPref(prefName, this.apiKey);
                return true;
            } catch (e) {
                console.error("Can't save apiKey", e);
            }
        }

        return false;
    },

    getAppName: function () {
        if (this.appName === null) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.appName", defaultVal = null;
            try {
                this.appName = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : defaultVal;
            } catch (e) {
                this.appName = defaultVal;
            }
        }

        return this.appName;
    },

    setAppName: function (newAppName) {
        this.appName = newAppName;
        var prefName = "extensions.seleniumbuilder.plugins.applitools.appName";
        try {
            bridge.prefManager.setCharPref(prefName, this.appName);
        } catch (e) {
            console.error("Can't save pref", e);
        }
    },

    getTestName: function () {
        if (this.testName === null) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.testName", defaultVal = null;
            try {
                this.testName = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : defaultVal;
            } catch (e) {
                this.testName = defaultVal;
            }
        }

        return this.testName;
    },

    setTestName: function (newTestName) {
        this.testName = newTestName;
        var prefName = "extensions.seleniumbuilder.plugins.applitools.testName";
        try {
            bridge.prefManager.setCharPref(prefName, this.testName);
        } catch (e) {
            console.error("Can't save pref", e);
        }
    },

    getIsSendOnRecording: function () {
        if (this.isSendOnRecording === null) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.isSendOnRecording", defaultVal = false;
            try {
                this.isSendOnRecording = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) === "true" : defaultVal;
            } catch (e) {
                this.isSendOnRecording = defaultVal;
            }
        }

        return this.isSendOnRecording;
    },

    setIsSendOnRecording: function (value) {
        this.isSendOnRecording = !!value;
        var prefName = "extensions.seleniumbuilder.plugins.applitools.isSendOnRecording";
        try {
            bridge.prefManager.setCharPref(prefName, this.isSendOnRecording);
        } catch (e) {
            console.error("Can't save pref", e);
        }
    },

    getRecWinTitle: function () {
        return bridge.getRecordingWindow().document.title;
    },

    getRecWinViewportSize: function () {
        var recWindow = bridge.getRecordingWindow().window;
        return {
            width: recWindow.innerWidth,
            height: recWindow.innerHeight
        };
    },

    validateWindow: function (title) {
        if (this.getIsSendOnRecording() && !this.getApiKey()) {
            applitools.interface.settingsPanel.show();
            alert(_t('__applitools_alert_empty_apikey'));
            return;
        }

        title = title || this.getRecWinTitle();
        var checkWindowStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkWindow"], title);
        builder.record.recordStep(checkWindowStep);

        if (this.getIsSendOnRecording()) {
            builder.record.stop();
            var scrObj = applitools.screenshot.wholePage();
            this.checkImage(applitools.screenshot.canvasToBuffer(scrObj), title).then(function () {
                builder.record.continueRecording();
            });
        }
    },

    validateElement: function (title) {
        if (this.getIsSendOnRecording() && !this.getApiKey()) {
            applitools.interface.settingsPanel.show();
            alert(_t('__applitools_alert_empty_apikey'));
            return;
        }

        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            bridge.focusRecordingTab();
            applitools.interface.notificationBox.show(_t('__applitools_check_element_notification_message'));
            builder.record.verifyExplorer = new builder.VerifyExplorer(
                bridge.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(locator) {
                    title = title || applitools.getRecWinTitle();
                    var checkElementStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkElement"], locator, title);
                    builder.record.recordStep(checkElementStep);
                    jQuery('#record-panel').hide();
                    applitools.interface.notificationBox.hide();
                    bridge.focusRecorderWindow();

                    if (applitools.getIsSendOnRecording()) {
                        var recWindow = bridge.getRecordingWindow().document.defaultView;
                        var rect = locator.__originalElement.getBoundingClientRect();
                        var scrObj = applitools.screenshot.pageRegion(rect.x + recWindow.pageXOffset, rect.y + recWindow.pageYOffset, rect.width, rect.height);
                        applitools.checkImage(applitools.screenshot.canvasToBuffer(scrObj), title).then(function () {
                            builder.record.stopVerifyExploring();
                        });
                    } else {
                        // Don't immediately stop: this would cause the listener that prevents the click from
                        // actually activating the selected element to be detached prematurely.
                        setTimeout(function() { builder.record.stopVerifyExploring(); }, 1);
                    }
                },
                true
            );
        }
    },

    validateRegion: function (title) {
        if (this.getIsSendOnRecording() && !this.getApiKey()) {
            applitools.interface.settingsPanel.show();
            alert(_t('__applitools_alert_empty_apikey'));
            return;
        }

        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            bridge.focusRecordingTab();
            applitools.interface.notificationBox.show(_t('__applitools_check_region_notification_message'));
            builder.record.verifyExplorer = new applitools.SelectExplorer(
                bridge.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(region) {
                    title = title || applitools.getRecWinTitle();
                    var checkRegionStep = new builder.Step(
                        builder.selenium2.stepTypes["eyes.checkRegion"],
                        region.top.toString(),
                        region.left.toString(),
                        region.width.toString(),
                        region.height.toString(),
                        title
                    );
                    builder.record.recordStep(checkRegionStep);
                    jQuery('#record-panel').hide();
                    applitools.interface.notificationBox.hide();
                    bridge.focusRecorderWindow();

                    if (applitools.getIsSendOnRecording()) {
                        var scrObj = applitools.screenshot.pageRegion(region.left, region.top, region.width, region.height);
                        applitools.checkImage(applitools.screenshot.canvasToBuffer(scrObj), title).then(function () {
                            builder.record.stopVerifyExploring();
                        });
                    } else {
                        // Don't immediately stop: this would cause the listener that prevents the click from
                        // actually activating the selected element to be detached prematurely.
                        setTimeout(function() { builder.record.stopVerifyExploring(); }, 1);
                    }
                }
            );
        }
    },

    getSession: function () {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            var apiKey = that.getApiKey();
            if (!apiKey) {
                reject("API key is empty!");
                return;
            }

            if (!that.eyes) {
                that.eyes = new window.EyesImages.Eyes();
                that.eyes.setApiKey(apiKey);
                that.eyes.setInferredEnvironment("useragent:" + window.navigator.userAgent);
                that.eyes.setHostingApp("Selenium builder");
                that.eyesPromise = null;
            }

            if (!that.eyesPromise) {
                var location = bridge.getBrowser().location;
                var appName = that.getAppName() || location.hostname;
                var testName = that.getTestName() || location.pathname;
                var viewportSize = that.getRecWinViewportSize();
                that.eyesPromise = that.eyes.open(appName, testName, viewportSize).then(function () {
                    console.log("Eyes: new session opened.");
                    resolve();
                }, function (err) {
                    reject("Can't open session:" + err);
                });
            } else {
                that.eyesPromise.then(function () {
                    resolve();
                });
            }
        });
    },

    checkImage: function (imageBuffer, title) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            applitools.interface.spinner.show();
            return that.getSession().then(function () {
                console.log("Eyes: checking image...");
                return that.eyes.checkImage(imageBuffer, title).then(function (result) {
                    console.log("Eyes: check image - done.", result);
                    resolve(result);
                }, function (err) {
                    console.error("Eyes: error during checkImage:", err);
                    reject(err);
                }).then(function () {
                    applitools.interface.spinner.hide();
                });
            }, function (err) {
                console.error("Eyes: can't get session:", err);
                reject(err);
            });
        });
    },

    checkRegion: function (region, imageBuffer, title) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            applitools.interface.spinner.show();
            return that.getSession().then(function () {
                console.log("Eyes: checking region...");
                return that.eyes.checkRegion(region, imageBuffer, title).then(function (result) {
                    console.log("Eyes: check region - done.", result);
                    resolve(result);
                }, function (err) {
                    console.error("Eyes: error during checkRegion:", err);
                    reject(err);
                }).then(function () {
                    applitools.interface.spinner.hide();
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

            applitools.interface.spinner.show();
            return that.getSession().then(function () {
                console.log("Eyes: closing session...");
                return that.eyes.close(false);
            }, function () {
                return that.eyes.abortIfNotClosed();
            }).then(function (data) {
                console.log("Eyes: session closed.", data);
                applitools.interface.processTestResult(data);
                resolve(data);
            }, function (err) {
                console.error("Eyes: can't close session:", err);
                reject(err);
            }).then(function () {
                applitools.interface.spinner.hide();
                that.eyes = null;
            });
        });
    },

    forceCloseSession: function () {
        this.eyes = null;
    }
};