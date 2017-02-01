applitools.interface = {
    init: function () {
        builder.gui.menu.addItem('file', _t('__applitools_settings_menu'), 'file-applitools-settings', function() {
            applitools.interface.settingsDialog.show();
        });

        // load styles
        var font = document.createElement('link');
        font.setAttribute('href', 'https://fonts.googleapis.com/css?family=Lato:400,700');
        font.setAttribute('rel', 'stylesheet');

        var path = builder.plugins.getResourcePath('applitools', 'styles/recorder.css');
        var link = document.createElement('link');
        link.setAttribute('href', path + "?" + Math.random());
        link.setAttribute('rel', 'stylesheet');
        document.getElementsByTagName('head')[0].appendChild(font).appendChild(link);

        // settings panel
        var settingsNode = newNode('div', {'class': 'dialog applitools-settings-dialog', 'style': 'display: none;'},
            newNode('h2', _t('__applitools_settings')),
            newNode('a', {'href': '#', 'id': 'applitools-settings-close', 'class': 'applitools-dialog-close'},
                newNode('span', _t('__applitools_close'))
            ),
            newNode('span', {'class': 'close'}),
            newNode('hr'),
            newNode('p', {},
                newNode('label',  {'for' : 'applitools_server_url'}, _t('__applitools_server_url')),
                newNode('span', {'class': 'input-wrapper'},
                    newNode('input', {id: 'applitools_server_url', type: 'text'})
                )
            ),
            newNode('p', {},
                newNode('label',  {'for' : 'applitools_apikey'}, _t('__applitools_apikey')),
                newNode('span', {'class': 'input-wrapper'},
                    newNode('input', {id: 'applitools_apikey', type: 'text'})
                )
            ),
            newNode('p', {},
                newNode('a', {'href': 'https://eyes.applitools.com/app/tutorial', 'target': '_blank'}, _t('__applitools_lookup_api_key'))
            )
        );

        jQuery("#dialog-attachment-point").append(settingsNode);
        this.settingsDialog.element = $(settingsNode);

        // add panels
        var recordNode = newNode('div', {'id': 'applitools-panel', 'class': 'panel applitools-panel', 'style': 'display: none;'},
            newNode('p', {'class': 'logo-wrapper'}, newNode('span', {'class': 'applitools-logo'})),
            newNode('div', {'class': 'controls-wrapper'},
                newNode('a', {'href': '#', 'id': 'applitools-validate-window', 'class': 'applitools-button'}, _t('__applitools_validate_window')),
                newNode('a', {'href': '#', 'id': 'applitools-validate-element', 'class': 'applitools-button'}, _t('__applitools_validate_element')),
                newNode('a', {'href': '#', 'id': 'applitools-validate-region', 'class': 'applitools-button'}, _t('__applitools_validate_region'))
            ),
            newNode('div', {'class': 'form-wrapper'},
                newNode('p',
                    newNode('label',  {'for' : 'applitools_app_name'}, _t('__applitools_app_name')),
                    newNode('span', {'class': 'input-wrapper'},
                        newNode('input', {id: 'applitools_app_name', type: 'text'})
                    )
                ),
                newNode('p',
                    newNode('label',  {'for' : 'applitools_test_name'}, _t('__applitools_test_name')),
                    newNode('span', {'class': 'input-wrapper'},
                        newNode('input', {id: 'applitools_test_name', type: 'text'})
                    )
                )
            ),
            newNode('div', {'class': 'results-wrapper'},
                newNode('p', {'class': 'test-status-wrapper'},
                    newNode('span', {'class': 'test-status'}), ': ', newNode('span', {'class': 'test-title'})
                ),
                newNode('p',
                    newNode('a', {'href': '#', 'target': '_blank', 'class': 'applitools-button'}, _t('__applitools_see_details_here'))
                )
            )
        );

        jQuery('#panels').append(recordNode);
        this.applitoolsPanel.element = $(recordNode);

        jQuery(document).on('click', '#applitools-settings-close', function () {
            applitools.interface.settingsDialog.hide();
        });

        jQuery(document).on('change', 'input#applitools_apikey', function () {
            var newValue = jQuery(this).val();
            applitools.setApiKey(newValue);
        });

        jQuery(document).on('change', 'input#applitools_server_url', function () {
            var newValue = jQuery(this).val();
            applitools.setServerUrl(newValue);
        });

        jQuery(document).on('click', '#applitools-validate-window', function () {
            applitools.validateWindow();
        });

        jQuery(document).on('click', '#applitools-validate-element', function () {
            applitools.validateElement();
        });

        jQuery(document).on('click', '#applitools-validate-region', function () {
            applitools.validateRegion();
        });

        jQuery(document).on('change', 'input#applitools_app_name', function () {
            var newValue = jQuery(this).val();
            applitools.setAppName(newValue);
        });

        jQuery(document).on('change', 'input#applitools_test_name', function () {
            var newValue = jQuery(this).val();
            applitools.setTestName(newValue);
        });

        jQuery('#record-stop-button').off('click').on('click', function (e) {
            if (!applitools.getTestName()) {
                alert(_t('__applitools_test_name_required'));
                return;
            }

            builder.record.stop();
        });

        jQuery('#edit-clearresults').on('click', function() {
            applitools.interface.applitoolsPanel.showRecordPanel(true);
        });
    },

    settingsDialog: {
        element: null,
        show: function() {
            this.element.find('input#applitools_apikey')
                .val(applitools.getApiKey() || '');
            this.element.find('input#applitools_server_url')
                .val(applitools.getServerUrl() || '')
                .attr("placeholder", applitools.getDefaultServerUrl());

            this.element.show();
        },
        hide: function() {
            this.element.hide();
        }
    },

    applitoolsPanel: {
        element: null,
        showRecordPanel: function (formOnly) {
            if (formOnly) {
                this.element.find('.controls-wrapper').hide();
            } else {
                this.element.find('.controls-wrapper').show();
            }

            this.element.find('.form-wrapper').show();
            this.element.find('.results-wrapper').hide();
            this.element.removeClass("passed new failed aborted");

            this.element.find('input#applitools_app_name')
                .val(applitools.getAppName())
                .attr("placeholder", applitools.getDefaultAppName());
            this.element.find('input#applitools_test_name')
                .val(applitools.getTestName())
                .attr("placeholder", applitools.getDefaultTestName());

            this.element.show();
        },
        showResultsPanel: function (isPassed, isSaved, isAborted, batchUrl) {
            this.element.find('.controls-wrapper').hide();
            this.element.find('.form-wrapper').hide();
            this.element.find('.results-wrapper').show();
            this.element.removeClass("passed new failed aborted");

            var resultsWrapper = this.element.find('.results-wrapper');
            var appName = applitools.getAppName(true);
            var testName = applitools.getTestName(true);
            resultsWrapper.find('.test-title').text(appName + ' - ' + testName);
            resultsWrapper.find('a').attr('href', batchUrl);

            if (isSaved) {
                resultsWrapper.find('.test-status').text(_t('__applitools_test_new'));
                this.element.addClass("passed new");
            } else if (isPassed) {
                resultsWrapper.find('.test-status').text(_t('__applitools_test_passed'));
                this.element.addClass("passed");
            } else if (isAborted) {
                resultsWrapper.find('.test-status').text(_t('__applitools_test_aborted'));
                this.element.addClass("aborted");
            } else {
                resultsWrapper.find('.test-status').text(_t('__applitools_test_failed'));
                this.element.addClass("failed");
            }

            this.element.show();
        },
        hide: function () {
            this.element.hide();
            this.element.removeClass("passed new failed aborted");
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
        if (data.stepsInfo && !jQuery.isEmptyObject(data.stepsInfo)) {
            var script = builder.getScript();

            var i = 0, eyesStepsIDs = collectStepsIds();
            for (var key in data.stepsInfo) {
                if (data.stepsInfo.hasOwnProperty(key)) {
                    var step = script.getStepWithID(eyesStepsIDs[i++]);
                    if (step) {
                        step.outcome = data.stepsInfo[key].isDifferent ? builder.stepdisplay.state.FAILED : builder.stepdisplay.state.SUCCEEDED;
                    }
                }
            }

            builder.stepdisplay.update();
        }

        applitools.interface.applitoolsPanel.showResultsPanel(data.isPassed, data.isSaved, data.isAborted, data.appUrls.session);

        function collectStepsIds() {
            var recordedSteps = jQuery('#steps').find('.b-step').get();
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
        rawFile.open("GET", file);
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