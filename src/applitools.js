var applitools = {
    apiKey: null,
    appName: null,
    testName: null,
    isAskForMethodsTitle: null,

    eyes: null,
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

    getDefaultAppName: function () {
        return bridge.getRecordingWindow().location.hostname;
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

    getDefaultTestName: function () {
        return bridge.getRecordingWindow().location.pathname;
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

    getIsAskForMethodsTitle: function () {
        if (this.isAskForMethodsTitle === null) {
            var prefName = "extensions.seleniumbuilder.plugins.applitools.isAskForMethodsTitle", defaultVal = false;
            try {
                this.isAskForMethodsTitle = bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) === "true" : defaultVal;
            } catch (e) {
                this.isAskForMethodsTitle = defaultVal;
            }
        }

        return this.isAskForMethodsTitle;
    },

    setIsAskForMethodsTitle: function (value) {
        this.isAskForMethodsTitle = !!value;
        var prefName = "extensions.seleniumbuilder.plugins.applitools.isAskForMethodsTitle";
        try {
            bridge.prefManager.setCharPref(prefName, this.isAskForMethodsTitle);
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

    validateWindow: function () {
        var title = applitools.getRecWinTitle();
        if (applitools.getIsAskForMethodsTitle()) {
            title = applitools.interface.titlePrompt(title);
        }

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
            bridge.focusRecordingTab();
            applitools.interface.notificationBox.show(_t('__applitools_check_element_notification_message'));
            builder.record.verifyExplorer = new builder.VerifyExplorer(
                bridge.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(locator) {
                    jQuery('#record-panel').hide();

                    // Don't immediately stop: this would cause the listener that prevents the click from
                    // actually activating the selected element to be detached prematurely.
                    setTimeout(function() {
                        applitools.interface.notificationBox.hide();
                        builder.record.stopVerifyExploring();
                        bridge.focusRecorderWindow();

                        var title = applitools.getRecWinTitle();
                        if (applitools.getIsAskForMethodsTitle()) {
                            title = applitools.interface.titlePrompt(title);
                        }

                        var checkElementStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkElement"], locator, title);
                        builder.record.recordStep(checkElementStep);
                    }, 1);
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
            bridge.focusRecordingTab();
            applitools.interface.notificationBox.show(_t('__applitools_check_region_notification_message'));
            builder.record.verifyExplorer = new applitools.SelectExplorer(
                bridge.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(region) {
                    jQuery('#record-panel').hide();

                    // Don't immediately stop: this would cause the listener that prevents the click from
                    // actually activating the selected element to be detached prematurely.
                    setTimeout(function() {
                        applitools.interface.notificationBox.hide();
                        builder.record.stopVerifyExploring();
                        bridge.focusRecorderWindow();

                        var title = applitools.getRecWinTitle();
                        if (applitools.getIsAskForMethodsTitle()) {
                            title = applitools.interface.titlePrompt(title);
                        }

                        var checkRegionStep = new builder.Step(
                            builder.selenium2.stepTypes["eyes.checkRegion"],
                            region.top.toString(),
                            region.left.toString(),
                            region.width.toString(),
                            region.height.toString(),
                            title
                        );
                        builder.record.recordStep(checkRegionStep);
                    }, 1);
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
            }

            if (!that.eyes.isOpen()) {
                var appName = that.getAppName() || that.getDefaultAppName();
                var testName = that.getTestName() || that.getDefaultTestName();
                var viewportSize = that.getRecWinViewportSize();
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

    checkImage: function (imageBuffer, title) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            return that.getSession().then(function () {
                console.log("Eyes: checking image...");
                return that.eyes.checkImage(imageBuffer, title).then(function (result) {
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

    checkRegion: function (region, imageBuffer, title) {
        var that = this;
        return that.promiseFactory.makePromise(function (resolve, reject) {
            return that.getSession().then(function () {
                console.log("Eyes: checking region...");
                return that.eyes.checkRegion(region, imageBuffer, title).then(function (result) {
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
        if (this.eyes) {
            this.eyes.abortIfNotClosed();
            this.eyes = null;
        }
    }
};