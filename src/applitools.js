var applitools = {
    eyesSession: null,
    apiKey: null,
    appName: _t('__applitools_app_default_name'),
    testName: _t('__applitools_test_default_name'),
    isCustomTypesLoaded: false,
    loginManager: Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager),
    loginInfo: new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init"),

    customTypes: {
        "eyes.checkWindow": {
            "params": ["title"],
            "docs": {
                "description": "Capture full screen of the page."
            }
        },
        "eyes.checkElement": {
            "params": ["locator", "title"],
            "docs": {
                "description": "Capture screen of the element."
            }
        },
        "eyes.checkRegion": {
            "params": ["top", "left", "width", "height", "title"],
            "docs": {
                "description": "Capture screen of region on the page."
            }
        }
    },

    init: function () {
        if (!this.isCustomTypesLoaded) {
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
            this.isCustomTypesLoaded = true;
        }
    },

    shutdown: function () {
    },

    getApiKey: function() {
        if (!this.apiKey) {
            var logins = this.loginManager.findLogins({}, 'chrome://seleniumbuilder', null, 'Applitools API Key');
            for (var i = 0, l = logins.length; i < l; i++) {
                this.apiKey = logins[i].password;
                break;
            }
        }

        return this.apiKey;
    },

    setApiKey: function(newApiKey) {
        var logins = this.loginManager.findLogins({}, 'chrome://seleniumbuilder', null, 'Applitools API Key');
        for (var i = 0; i < logins.length; i++) {
            this.loginManager.removeLogin(logins[i]);
        }
        this.apiKey = null;

        if (typeof(newApiKey) === 'string' && newApiKey.length >= 1) {
            var loginInfo = new this.loginInfo(
                'chrome://seleniumbuilder', null, 'Applitools API Key',
                /*username*/      "api-key",
                /*password*/      newApiKey,
                /*usernameField*/ "",
                /*passwordField*/ ""
            );
            this.loginManager.addLogin(loginInfo);
            this.apiKey = newApiKey;
            return true;
        }

        return false;
    },

    getRecWinTitle: function () {
        return window.sebuilder.getRecordingWindow().document.title;
    },

    getRecWinViewportSize: function () {
        var recordingWindow = window.sebuilder.getRecordingWindow().window;
        return {
            width: recordingWindow.innerWidth,
            height: recordingWindow.innerHeight
        };
    },

    checkWindow: function (title) {
        if (!this.getApiKey()) {
            interface.settingsPanel.show();
            alert(_t('__applitools_alert_empty_apikey'));
            return;
        }

        title = title || this.getRecWinTitle();
        var checkWindowStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkWindow"], title);
        builder.record.recordStep(checkWindowStep);

        var scrObj = screenshot.wholePage();
        builder.record.stop();
        var promise = this.sendImage(scrObj, title);
        if (promise) {
            promise.then(function () {
                builder.record.continueRecording();
            });
        }
    },

    checkElement: function (title) {
        if (!this.getApiKey()) {
            interface.settingsPanel.show();
            alert(_t('__applitools_alert_empty_apikey'));
            return;
        }

        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            window.sebuilder.focusRecordingTab();
            interface.notificationBox.show(_t('__applitools_check_element_notification_message'));
            builder.record.verifyExplorer = new builder.VerifyExplorer(
                window.sebuilder.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(locator) {
                    title = title || applitools.getRecWinTitle();
                    var checkElementStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkElement"], locator, title);
                    builder.record.recordStep(checkElementStep);
                    jQuery('#record-panel').hide();
                    window.sebuilder.focusRecorderWindow();

                    interface.notificationBox.hide();
                    builder.record.verifyExploring = false;
                    builder.record.verifyExplorer.destroy();
                    builder.record.verifyExplorer = null;

                    var recWindow = window.sebuilder.getRecordingWindow().document.defaultView;
                    var rect = locator.__originalElement.getBoundingClientRect();
                    var scrObj = screenshot.pageRegion(rect.x + recWindow.pageXOffset, rect.y + recWindow.pageYOffset, rect.width, rect.height);
                    var promise = applitools.sendImage(scrObj, title);
                    if (promise) {
                        promise.then(function () {
                            builder.record.continueRecording();
                        });
                    } else {
                        // Don't immediately stop: this would cause the listener that prevents the click from
                        // actually activating the selected element to be detached prematurely.
                        setTimeout(function() { builder.record.continueRecording(); }, 1);
                    }
                },
                true
            );
        }
    },

    checkRegion: function (title) {
        if (!this.getApiKey()) {
            interface.settingsPanel.show();
            alert(_t('__applitools_alert_empty_apikey'));
            return;
        }

        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            window.sebuilder.focusRecordingTab();
            interface.notificationBox.show(_t('__applitools_check_region_notification_message'));
            builder.record.verifyExplorer = new applitools.SelectExplorer(
                window.sebuilder.getRecordingWindow(),
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
                    window.sebuilder.focusRecorderWindow();

                    interface.notificationBox.hide();
                    builder.record.verifyExploring = false;
                    builder.record.verifyExplorer.destroy();
                    builder.record.verifyExplorer = null;

                    var scrObj = screenshot.pageRegion(region.left, region.top, region.width, region.height);
                    var promise = applitools.sendImage(scrObj, title);
                    if (promise) {
                        promise.then(function () {
                            builder.record.continueRecording();
                        });
                    } else {
                        // Don't immediately stop: this would cause the listener that prevents the click from
                        // actually activating the selected element to be detached prematurely.
                        setTimeout(function() { builder.record.continueRecording(); }, 1);
                    }
                }
            );
        }
    },

    sendImage: function (scrObj, title) {
        var apiKey = this.getApiKey();
        if (apiKey) {
            if (!this.eyesSession) {
                this.eyesSession = new applitools.EyesSession(this.appName, this.testName, this.getRecWinViewportSize(), apiKey);
            } else if (this.eyesSession.isClosed) {
                return;
            }

            interface.spinner.show();
            try {
                return this.eyesSession.sendImage(scrObj.canvas, title).then(function () {
                    interface.spinner.hide();
                    console.log("image sent");
                }, function (err) {
                    interface.spinner.hide();
                    console.error("Error during sendImage", err);
                });
            } catch (err) {
                interface.spinner.hide();
                console.error(err);
            }
        }
    },

    closeSession: function () {
        if (this.eyesSession) {
            console.log("close session");
            interface.spinner.show();
            try {
                var promise = this.eyesSession.close();
                if(promise) {
                    return promise.then(function (data) {
                        interface.processTestResult(data);
                        console.log("session closed");
                    }, function (err) {
                        console.error("Session can't be closed", err);
                    }).then(function () {
                        interface.spinner.hide();
                    });
                }
            } catch (err) {
                console.error(err);
            }

            interface.spinner.hide();
        }
    },

    forceCloseSession: function () {
        if (this.eyesSession) {
            this.eyesSession = null;
        }
    }
};