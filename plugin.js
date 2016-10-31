// Init plugin interface
builder.registerPostLoadHook(function () {
    applitools.init();
    interface.init();

    builder.gui.menu.addItem('file', _t('__applitools_settings_menu'), 'file-applitools-settings', function() {
        interface.settingsPanel.show();
    });

    builder.gui.menu.addMenu(_t('__applitools'), 'applitools');
    builder.gui.menu.addItem('applitools', _t('__applitools_record_window'), 'applitools-record-window');
    builder.gui.menu.addItem('applitools', _t('__applitools_record_element'), 'applitools-record-element');
    builder.gui.menu.addItem('applitools', _t('__applitools_record_region'), 'applitools-record-region');

    jQuery('#record-stop-button').click(function (e) {
        console.log("stop button");
        e.stopPropagation();

        applitools.closeSession();
        builder.record.stop();
    });
});

// Override start recording method
builder.record.startRecording = (function() {
    var cached_function = builder.record.startRecording;
    return function() {
        var result = cached_function.apply(this, arguments);
        console.log("startRecording call");
        interface.applitoolsPanel.hide();
        interface.controlButtons.show();
        applitools.forceCloseSession();
        return result;
    };
})();

// Override start recording method
builder.record.stopAll = (function() {
    var cached_function = builder.record.stopAll;
    return function() {
        var result = cached_function.apply(this, arguments);
        console.log("stopAll call");
        interface.controlButtons.hide();
        applitools.closeSession();
        return result;
    };
})();

// Override start recording method
builder.record.continueRecording = (function() {
    var cached_function = builder.record.continueRecording;
    return function() {
        var result = cached_function.apply(this, arguments);
        console.log("continueRecording call");
        interface.applitoolsPanel.hide();
        return result;
    };
})();