var interface = {
    settingsDialog: null,

    init: function () {
        // load styles
        var path = builder.plugins.getResourcePath('applitools', 'styles.css');
        var link = document.createElement('link');
        link.setAttribute('href', path + "?" + Math.random());
        link.setAttribute('rel', 'stylesheet');
        document.getElementsByTagName('head')[0].appendChild(link);

        // add spinner into recorder
        $("html > body").append("<div id='fullpage-spinner' class='spinner'><span>Please wait...</span></div>");
        this.spinner.element = $("#fullpage-spinner");

        $('#panels').append("<div id='applitools-panel' class='panel'></div>");
        this.applitoolsPanel.element = $("#applitools-panel");

        $(document).on('click', '#applitools-record-window', function () {
            applitools.checkWindow();
        });

        $(document).on('click', '#applitools-record-element', function () {
            applitools.checkElement();
        });

        $(document).on('click', '#applitools-record-region', function () {
            applitools.checkRegion();
        });

        // add panels
        $('#panels #record-panel').prepend("<a href='#' id='applitools-record-window' class='button button-applitools'>" + _t('__applitools_record_window') + "</a>" +
        "<a href='#' id='applitools-record-element' class='button button-applitools'>" + _t('__applitools_record_element') + "</a>" +
        "<a href='#' id='applitools-record-region' class='button button-applitools'>" + _t('__applitools_record_region') + "</a><br/>");

        // settings panel
        var appName = applitools.getAppName() || '';
        var testName = applitools.getTestName() || '';
        var apiKey = applitools.getApiKey() || '';
        this.settingsDialog =
            newNode('div', {'class': 'dialog'},
                newNode('h2', _t('__applitools_settings')),
                newNode('table', {style: 'border: none;', id: 'rc-options-table'},
                    newNode('tr',
                        newNode('td', _t('__applitools_apikey') + " "),
                        newNode('td', newNode('input', {id: 'applitools_apikey', type: 'text', value: apiKey})),
                        newNode('td',
                            newNode('span', ' ('),
                            newNode('a', {'href': 'https://eyes.applitools.com/app/tutorial', 'target': '_blank'}, _t('__applitools_lookup_api_key')),
                            newNode('span', ') ')
                        )
                    )
                ),
                newNode('hr'),
                newNode('h3', _t('__applitools_settings_test')),
                newNode('div',
                    newNode('span', ' '),
                    newNode('span', _t('__applitools_settings_test_description')),
                    newNode('span', ' ')
                ),
                newNode('table', {style: 'border: none;', id: 'rc-options-table'},
                    newNode('tr',
                        newNode('td', _t('__applitools_app_name') + " "),
                        newNode('td', newNode('input', {
                            id: 'applitools_app_name',
                            type: 'text',
                            value: appName,
                            'change': function() {}
                        }))
                    ),
                    newNode('tr',
                        newNode('td', _t('__applitools_test_name') + " "),
                        newNode('td', newNode('input', {
                            id: 'applitools_test_name',
                            type: 'text',
                            value: testName,
                            'change': function() {}
                        }))
                    )
                ),
                newNode('hr'),
                newNode('div', {style: 'margin-top:20px;'},
                    newNode('a', {
                        'href': '#',
                        'class': 'button',
                        'id': 'applitools-cancel',
                        'click': function() {
                            var appName = jQuery('#applitools_app_name').val();
                            var testName = jQuery('#applitools_test_name').val();
                            var apiKey = jQuery('#applitools_apikey').val().trim();
                            if (applitools.setApiKey(apiKey)) {
                                applitools.setAppName(appName);
                                applitools.setTestName(testName);
                                interface.settingsPanel.hide();
                            } else {
                                alert(_t('__applitools_alert_empty_apikey_on_save'));
                            }
                        }
                    }, _t('__applitools_close'))
                )
            );
    },

    controlButtons: {
        element: null,
        show: function() {
            $('.button-applitools').show();
        },
        hide: function() {
            $('.button-applitools').hide();
        }
    },

    settingsPanel: {
        element: null,
        show: function() {
            if (this.element) { return; }
            this.element = interface.settingsDialog;
            builder.dialogs.show(this.element);
        },
        hide: function() {
            jQuery(this.element).remove();
            this.element = null;
        }
    },

    spinner: {
        element: null,
        show: function () {
            this.element.show();
        },
        hide: function () {
            this.element.hide();
        }
    },

    alert: {
        show: function (message) {
            Components.classes['@mozilla.org/alerts-service;1']
                .getService(Components.interfaces.nsIAlertsService)
                .showAlertNotification(null, _t('__applitools'), message);
        }
    },

    applitoolsPanel: {
        element: null,
        show: function (status, message) {
            this.element.html(message).attr('class', 'panel ' + status).show();
        },
        hide: function () {
            this.element.hide();
        }
    },

    notificationBox: {
        element: null,
        show: function (message) {
            if (this.element == null) {
                var recWindow = bridge.getRecordingWindow().document.defaultView;
                this.element = bridge.getBrowser().getNotificationBox(recWindow);
                this.element.appendNotification(
                    message,
                    'notification-box',
                    null,
                    this.element.PRIORITY_INFO_HIGH,
                    []
                );
            }
        },
        hide: function () {
            if (this.element != null) {
                this.element.removeCurrentNotification();
                this.element = null;
            }
        }
    },

    processTestResult: function (data) {
        var url = "<p class='wrap-ellipsis'>See details at <a href='" + data.appUrls.batch + "' target='_blank'>" + data.appUrls.batch + "</a></p>";

        if (data.isPassed) {
            this.applitoolsPanel.show('passed', "<p>EYES: Test passed</p>" + url);
        } else if (data.isSaved) {
            this.applitoolsPanel.show('passed', "<p>EYES: New test ended</p>" + url);
        } else {
            this.applitoolsPanel.show('failed', "<p>EYES: Test failed (Immediate failure report on mismatch)</p>" + url);
        }

        if (data.stepsInfo && !jQuery.isEmptyObject(data.stepsInfo)) {
            var script = builder.getScript();

            var i = 0, eyesStepsIDs = collectStepsIds();
            for (var key in data.stepsInfo) {
                if (data.stepsInfo.hasOwnProperty(key)) {
                    var step = script.getStepWithID(eyesStepsIDs[i++]);
                    if (step) {
                        step.outcome = data.stepsInfo[key].isDifferent ?
                            builder.stepdisplay.state.FAILED : builder.stepdisplay.state.SUCCEEDED;
                    }
                }
            }

            builder.stepdisplay.update();
        }

        function collectStepsIds() {
            var recordedSteps = jQuery('#steps .b-step').get();
            var stepsIDs = [];
            for (var i = 0, len = recordedSteps.length; i < len; i++) {
                if (jQuery(recordedSteps[i]).find('.b-method').attr('name').startsWith("eyes.")) {
                    stepsIDs.push(parseInt(recordedSteps[i].id, 10))
                }
            }

            stepsIDs.sort(function(a, b){return a-b});
            return stepsIDs;
        }
    },

    loadStylesFromFile: function (file, styles) {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.onreadystatechange = function () {
            if(rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status == 0)) {
                var text = rawFile.responseText;
                if (styles.styleSheet) {
                    styles.styleSheet.cssText = text;
                } else {
                    styles.appendChild(window.document.createTextNode(text));
                }
            }
        };
        rawFile.send(null);
    }

};