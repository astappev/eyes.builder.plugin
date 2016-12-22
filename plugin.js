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

    // Show controls buttons for quick usage of validate methods
    applitools.interface.controlButtons.show();
    // Hide panel with results of previous tests ()if opened
    applitools.interface.applitoolsPanel.hide();
    // Close session if opened
    applitools.forceCloseSession();
};

// Override start recording method
builder.record.stopAll = (function() {
    var cached_function = builder.record.stopAll;
    return function() {
        console.log("builder.record.stopAll()");
        var result = cached_function.apply(this, arguments);
        applitools.interface.controlButtons.hide();
        applitools.interface.applitoolsPanel.hide();
        applitools.closeSession();
        return result;
    };
})();

// Override shutdown method
builder.selenium2.rcPlayback.shutdown = (function() {
    var cached_function = builder.selenium2.rcPlayback.shutdown;
    return function() {
        console.log("builder.selenium2.rcPlayback.shutdown()");
        var result = cached_function.apply(this, arguments);
        applitools.closeSession();
        return result;
    };
})();

// Override start recording method
builder.record.continueRecording = (function() {
    var cached_function = builder.record.continueRecording;
    return function() {
        console.log("builder.record.continueRecording()");
        var result = cached_function.apply(this, arguments);
        applitools.interface.applitoolsPanel.hide();
        return result;
    };
})();