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

        // add panel
        $('#panels').append("<div id='applitools-panel' class='panel'></div>");
        this.applitoolsPanel.element = $("#applitools-panel");

        // settings panel
        var credentials = applitools.getCredentials();
        this.settingsDialog =
            newNode('div', {'class': 'dialog'},
                newNode('h2', _t('__applitools_settings')),
                newNode('table', {style: 'border: none;', id: 'rc-options-table'},
                    newNode('tr',
                        newNode('td', _t('__applitools_apikey') + " "),
                        newNode('td', newNode('input', {id: 'applitools_apikey', type: 'text', value: credentials.apikey})),
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
                            value: _t('__applitools_app_default_name'),
                            'change': function() {}
                        }))
                    ),
                    newNode('tr',
                        newNode('td', _t('__applitools_test_name') + " "),
                        newNode('td', newNode('input', {
                            id: 'applitools_test_name',
                            type: 'text',
                            value: _t('__applitools_test_default_name'),
                            'change': function() {}
                        }))
                    )
                ),
                newNode('hr'),
                newNode('div', {style: 'margin-top:20px;'},
                    newNode('a', {'href': '#', 'class': 'button', 'id': 'applitools-cancel', 'click': function() {
                            debugger;
                            applitools.setCredentials();
                            applitools.appName = jQuery('#applitools_app_name').val();
                            applitools.testName = jQuery('#applitools_test_name').val();
                            interface.settingsPanel.hide();
                        }}, _t('__applitools_close')
                    )
                )
            );
    },
    settingsPanel: {
        element: null,
        show: function() {
            debugger;
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
        show: function (justSpinner) {
            this.element.show();
            if (!justSpinner) {
                builder.record.stop();
            }
        },
        hide: function (justSpinner) {
            this.element.hide();
            if (!justSpinner) {
                builder.record.continueRecording();
            }
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
            debugger;
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
    }

};