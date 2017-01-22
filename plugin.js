// Init plugin interface
builder.registerPostLoadHook(function () {
    applitools.init();
    applitools.interface.init();
});

// Override start recording method
builder.record.startRecording = function(urlText, seleniumVersion, deleteCookies) {
    var anchorIndex = urlText.indexOf('#');
    if (anchorIndex !== -1) {
        urlText = urlText.substring(0, anchorIndex);
    }
    var url = new builder.Url(urlText);

    if (!url.hostname() || urlText.substring(0, 6) === 'about:') {
        alert(_t('record_invalid_url'));
        jQuery("#startup-url").focus();
        return;
    }

    // Delete cookies for given URL if the option is checked
    if (deleteCookies) {
        builder.deleteURLCookies(url.href());
    }

    // Now load the page - both to ensure we're on the right page when we start recording
    // and to ensure that we get a clean page free of cookie influence.
    // Don't show the record interface until the new page has loaded.
    var isLoading = false;
    builder.record.pageLoadListener = function(urlText, pageloading) {
        var url = new builder.Url(urlText);
        if (pageloading) {
            isLoading = true;
            jQuery('#heading-record').addClass('is-on');
        } else {
            jQuery('#heading-record').removeClass('is-on');
            if (isLoading) {
                builder.record.recording = true;
                builder.gui.switchView(builder.views.script);
                builder.suite.addScript(new builder.Script(seleniumVersion));
                builder.getScript().saveRequired = true;
                var viewportSize = applitools.getRecWinViewportSize();
                builder.getScript().addStep(new builder.Step(builder.selenium2.stepTypes.setWindowSize, viewportSize.width.toString(), viewportSize.height.toString()));
                builder.getScript().addStep(new builder.Step(builder.selenium2.stepTypes.get, url.href()));
                builder.stepdisplay.update();
                builder.pageState.removeListener(builder.record.pageLoadListener);
                builder.record.continueRecording();
            }
            isLoading = false;
        }
    };
    builder.pageState.addListener(builder.record.pageLoadListener);
    window.sebuilder.getRecordingWindow().location = url.href();

    // Close session if opened
    applitools.forceCloseSession();
    // Hide panel with results of previous tests ()if opened
    applitools.interface.applitoolsResultsPanel.hide();
};

// Override method called on screen is changed
builder.gui.switchView = (function() {
    var cached_function = builder.gui.switchView;
    return function() {
        console.log("builder.gui.switchView()");
        var result = cached_function.apply(this, arguments);
        if (arguments[0] == builder.views.script) {
            applitools.interface.applitoolsRecordPanel.show(true);
        }
        return result;
    };
})();

// Override method called on click "Run on Selenium Builder"
builder.dialogs.rc.show = (function() {
    var cached_function = builder.dialogs.rc.show;
    return function() {
        console.log("builder.dialogs.rc.show()");
        if (!applitools.getTestName()) {
            alert(_t('__applitools_test_name_required'));
            return;
        }
        var result = cached_function.apply(this, arguments);
        return result;
    };
})();

// Override method called on start playback
builder.views.script.onStartRCPlayback = (function() {
    var cached_function = builder.views.script.onStartRCPlayback;
    return function() {
        console.log("builder.views.script.onStartRCPlayback()");
        applitools.interface.applitoolsRecordPanel.hide();
        applitools.interface.applitoolsResultsPanel.hide();
        var result = cached_function.apply(this, arguments);
        return result;
    };
})();

// Override method called on click save script
builder.dialogs.exportscript.save = (function() {
    var cached_function = builder.dialogs.exportscript.save;
    return function() {
        console.log("builder.dialogs.exportscript.save()");
        applitools.saveVariableToCurrentScript('appName', applitools.getAppName() || applitools.getDefaultAppName());
        applitools.saveVariableToCurrentScript('testName', applitools.getTestName() || applitools.getDefaultTestName());
        var result = cached_function.apply(this, arguments);
        return result;
    };
})();

builder.dialogs.exportscript.saveAs = (function() {
    var cached_function = builder.dialogs.exportscript.saveAs;
    return function() {
        console.log("builder.dialogs.exportscript.saveAs()");
        applitools.saveVariableToCurrentScript('appName', applitools.getAppName() || applitools.getDefaultAppName());
        applitools.saveVariableToCurrentScript('testName', applitools.getTestName() || applitools.getDefaultTestName());
        var result = cached_function.apply(this, arguments);
        return result;
    };
})();

// Override stop recording method
builder.record.stop = (function() {
    var cached_function = builder.record.stop;
    return function() {
        console.log("builder.record.stop()");
        applitools.interface.applitoolsRecordPanel.hide(true);
        var result = cached_function.apply(this, arguments);
        return result;
    };
})();

// Override shutdown method
builder.selenium2.rcPlayback.shutdown = (function() {
    var cached_function = builder.selenium2.rcPlayback.shutdown;
    return function() {
        console.log("builder.selenium2.rcPlayback.shutdown()");
        var result = cached_function.apply(this, arguments);
        if (arguments[0].currentStep.outcome < builder.stepdisplay.state.ERROR) {
            applitools.closeSession();
        } else {
            applitools.forceCloseSession();
        }
        return result;
    };
})();

// Override start recording method
builder.record.continueRecording = (function() {
    var cached_function = builder.record.continueRecording;
    return function() {
        console.log("builder.record.continueRecording()");
        applitools.interface.applitoolsResultsPanel.hide();
        applitools.interface.applitoolsRecordPanel.show();
        var result = cached_function.apply(this, arguments);
        return result;
    };
})();

// Override script parsing method
builder.selenium2.io.parseScript = (function() {
    var cached_function = builder.selenium2.io.parseScript;
    return function() {
        console.log("builder.selenium2.io.parseScript()");
        var result = cached_function.apply(this, arguments);
        if (result && result.data) {
            applitools.setAppName(result.data.appName);
            applitools.setTestName(result.data.testName);
        }
        return result;
    };
})();

builder.record.verifyExplore = function() {
    builder.record.verifyExploring = true;
    builder.record.stop();
    jQuery('#record-panel').show();
    applitools.interface.applitoolsRecordPanel.show();
    window.sebuilder.focusRecordingTab();
    builder.record.verifyExplorer = new builder.VerifyExplorer(
        window.sebuilder.getRecordingWindow(),
        builder.getScript().seleniumVersion,
        function(step) {
            builder.record.recordStep(step);
            // Don't immediately stop: this would cause the listener that prevents the click from
            // actually activating the selected element to be detached prematurely.
            setTimeout(function() { builder.record.stopVerifyExploring(); }, 1);
            window.sebuilder.focusRecorderWindow();
        }
    );
};