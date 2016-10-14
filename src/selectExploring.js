/**
 * Used for selecting region on the page
 *
 * @param {object} top_window The frame to explore
 * @param {object} seleniumVersion version to generate steps for
 * @param {function} callbackFunc Function called with recorded verify step
 */
applitools.SelectExplorer = function (top_window, seleniumVersion, callbackFunc) {
    this.top_window = top_window;
    this.seleniumVersion = seleniumVersion;
    this.recordStep = callbackFunc;
    this.highlit_element = null;

    this.widget = applitools.selectWidget(top_window, this.saveRegion.bind(this));
    interface.notificationBox.show(widget.window, _t('__applitools_check_region_notification_message'));
};

applitools.SelectExplorer.prototype = {

    saveRegion: function (e) {
        window.focus();

        var region = this.widget.getRegion();
        this.destroy();
        this.recordStep(region);
    },

    destroy: function () {
        this.widget.close();
        interface.notificationBox.hide();
    }
};

if (builder && builder.loader && builder.loader.loadNextMainScript) {
    builder.loader.loadNextMainScript();
}
