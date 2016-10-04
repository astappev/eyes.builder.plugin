// Init plugin interface
builder.registerPostLoadHook(function () {
    applitools.init();
    interface.init();

    builder.gui.menu.addItem('file', _t('__applitools_settings'), 'file-applitools-settings', function() {
        interface.settingsPanel.show();
    });

    builder.gui.menu.addMenu(_t('__applitools'), 'applitools');
    builder.gui.menu.addItem('applitools', _t('__applitools_menu_check_window'), 'applitools-check-window', function () {
        var title = window.sebuilder.getRecordingWindow().document.title;
        applitools.checkWindow(title);
    });
    builder.gui.menu.addItem('applitools', _t('__applitools_menu_check_element'), 'applitools-check-element', function () {
        var title = window.sebuilder.getRecordingWindow().document.title;
        applitools.checkElement(title);
    });

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
        interface.applitoolsPanel.hide();
        applitools.forceCloseSession();
        return result;
    };
})();