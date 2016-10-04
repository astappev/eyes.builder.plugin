var applitools = {
    eyes: null,
    appName: _t('__applitools_app_default_name'),
    testName: _t('__applitools_test_default_name'),
    isCustomTypesLoaded: false,
    loginManager: Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager),
    loginInfo: new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init"),

    customTypes: {
        "eyes.checkWindow": {
            "params": ["title"],
            "docs": {
                "description": "Capture full screen of current page."
            }
        },
        "eyes.checkElement": {
            "params": ["locator", "title"],
            "docs": {
                "description": "Capture screen of the element."
            }
        }
    },

    init: function () {
        if (!this.isCustomTypesLoaded) {
            var items = [];
            for (var n in this.customTypes) {
                builder.selenium2.__stepData[n] = this.customTypes[n].params;
                builder.selenium2.docs[n] = this.customTypes[n].docs;

                builder.selenium2.stepTypes[n] = new builder.selenium2.StepType(n);
                items.push(builder.selenium2.stepTypes[n]);
            }

            builder.selenium2.categories.push([_t('__applitools'), items]);
            this.isCustomTypesLoaded = true;
        }
    },

    shutdown: function () {
    },

    getCredentials: function() {
        var logins = this.loginManager.findLogins(
            {}, 'chrome://seleniumbuilder', null, 'Applitools API Key'
        );

        for (var i = 0; i < logins.length; i++) {
            return {'apikey': logins[i].password};
        }
        return {'apikey': ""};
    },

    setCredentials: function() {
        var apikey = jQuery('#applitools_apikey').val();

        var logins = this.loginManager.findLogins(
            {}, 'chrome://seleniumbuilder', null, 'Applitools API Key'
        );

        for (var i = 0; i < logins.length; i++) {
            this.loginManager.removeLogin(logins[i]);
        }

        if (apikey) {
            var loginInfo = new this.loginInfo(
                'chrome://seleniumbuilder', null, 'Applitools API Key',
                /*username*/      "api-key",
                /*password*/      apikey,
                /*usernameField*/ "",
                /*passwordField*/ ""
            );
            this.loginManager.addLogin(loginInfo);
        }
    },

    checkWindow: function (title) {
        var checkWindowStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkWindow"], title);
        builder.record.recordStep(checkWindowStep);

        var scrObj = screenshot.wholePage();
        this.sendImage(scrObj, title);
    },

    checkElement: function (title) {
        if (builder.record.verifyExploring) {
            builder.record.stopVerifyExploring();
        } else {
            builder.record.verifyExploring = true;
            builder.record.stop();
            jQuery('#record-panel').show();
            window.sebuilder.focusRecordingTab();
            builder.record.verifyExplorer = new builder.VerifyExplorer(
                window.sebuilder.getRecordingWindow(),
                builder.getScript().seleniumVersion,
                function(locator) {
                    // Don't immediately stop: this would cause the listener that prevents the click from
                    // actually activating the selected element to be detached prematurely.
                    setTimeout(function() { builder.record.stopVerifyExploring(); }, 1);

                    var checkElementStep = new builder.Step(builder.selenium2.stepTypes["eyes.checkElement"], locator, title);
                    builder.record.recordStep(checkElementStep);
                    var rect = locator.__originalElement.getBoundingClientRect();
                    var scrObj = screenshot.pageRegion(rect.x, rect.y, rect.width, rect.height);
                    var promise = applitools.sendImage(scrObj, title);

                    if (promise) {
                        promise.then(function () {
                            window.sebuilder.focusRecorderWindow();
                        });
                    }
                },
                true
            );
        }
    },

    sendImage: function (scrObj, title) {
        interface.spinner.show();
        console.log("send image");

        var apiKey = this.getCredentials().apikey;
        if (apiKey) {
            if (!this.eyes) {
                this.eyes = new eyes(this.appName, this.testName, apiKey);
            }

            try {
                return this.eyes.sendImage(scrObj.canvas, title).then(function () {
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

    forceCloseSession: function () {
        if (this.eyes) {
            this.eyes = null;
        }
    },

    closeSession: function () {
        if (this.eyes) {
            console.log("close session");
            interface.spinner.show(true);
            try {
                this.eyes.close().then(function (data) {
                    interface.processTestResult(data);
                    interface.spinner.hide(true);
                    console.log("session closed");
                }, function (err) {
                    interface.spinner.hide(true);
                    console.error("Session can't be closed", err);
                });
            } catch (err) {
                interface.spinner.hide(true);
                console.error(err);
            }
        }
    }
};