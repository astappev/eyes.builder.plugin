applitools.interface = {
    settingsDialog: null,

    init: function () {
        builder.gui.menu.addItem('file', _t('__applitools_settings_menu'), 'file-applitools-settings', function() {
            applitools.interface.settingsPanel.show();
        });

        // load styles
        var path = builder.plugins.getResourcePath('applitools', 'styles.css');
        var link = document.createElement('link');
        link.setAttribute('href', path + "?" + Math.random());
        link.setAttribute('rel', 'stylesheet');
        document.getElementsByTagName('head')[0].appendChild(link);

        // add panels
        var $panels = jQuery('#panels');
        $panels.append("<div id='applitools-panel' class='panel'></div>");
        this.applitoolsPanel.element = jQuery("#applitools-panel");

        var eyesForm =
            newNode('div', {'id': 'applitools-record-form-div'},
                newNode('table', {style: 'border: none;', id: 'rc-options-table'},
                    newNode('tr',
                        newNode('td', _t('__applitools_app_name') + " "),
                        newNode('td', newNode('input', {id: 'eyes-app-name', type: 'text', value: applitools.getAppName()}))
                    ),
                    newNode('tr',
                        newNode('td', _t('__applitools_test_name') + " "),
                        newNode('td', newNode('input', {id: 'eyes-test-name', type: 'text', value: applitools.getTestName()}))
                    )
                )
            );

        var eyesButtons =
            newNode('div', {'class': 'applitools-record-buttons-div'},
                newNode('a', {'href': '#', 'id': 'applitools-record-window', 'class': 'button button-applitools'}, _t('__applitools_record_window')),
                newNode('a', {'href': '#', 'id': 'applitools-record-element', 'class': 'button button-applitools'}, _t('__applitools_record_element')),
                newNode('a', {'href': '#', 'id': 'applitools-record-region', 'class': 'button button-applitools'}, _t('__applitools_record_region'))
            );

        var eyesCheckbox =
            newNode('div', {'class': 'ask-for-methods-title-div'},
                newNode('input', {'id': 'ask-for-methods-title', 'type': 'checkbox'}),
                newNode('label', {'id': 'ask-for-methods-title-label', 'for': 'ask-for-methods-title'}, _t('__applitools_is_ask_for_methods_title'))
            );

        $panels.find('#record-panel').prepend(eyesButtons).prepend(eyesForm).append(eyesCheckbox);

        // settings panel
        this.settingsDialog =
            newNode('div', {'class': 'dialog'},
                newNode('h2', _t('__applitools_settings')),
                newNode('table', {style: 'border: none;', id: 'rc-options-table'},
                    newNode('tr',
                        newNode('td', _t('__applitools_apikey') + " "),
                        newNode('td', newNode('input', {
                            id: 'applitools_apikey',
                            type: 'text'
                        })),
                        newNode('td',
                            newNode('span', ' ('),
                            newNode('a', {'href': 'https://eyes.applitools.com/app/tutorial', 'target': '_blank'}, _t('__applitools_lookup_api_key')),
                            newNode('span', ') ')
                        )
                    )
                ),
                newNode('div', {style: 'margin-top:20px;'},
                    newNode('a', {'href': '#', 'class': 'button', 'id': 'applitools-ok',
                        'click': function() {
                            var apiKey = jQuery('#applitools_apikey').val().trim();
                            if (applitools.setApiKey(apiKey)) {
                                applitools.interface.settingsPanel.hide();
                            } else {
                                alert(_t('__applitools_alert_empty_apikey_on_save'));
                            }
                        }
                    }, _t('__applitools_ok')),
                    newNode('a', {'href': '#', 'class': 'button', 'id': 'applitools-cancel',
                        'click': function() {
                            applitools.interface.settingsPanel.hide();
                        }
                    }, _t('__applitools_cancel'))
                )
            );

        jQuery(document).on('click', '#applitools-record-window', function () {
            applitools.validateWindow();
        });

        jQuery(document).on('click', '#applitools-record-element', function () {
            applitools.validateElement();
        });

        jQuery(document).on('click', '#applitools-record-region', function () {
            applitools.validateRegion();
        });

        jQuery('#edit-clearresults').click(function() {
            jQuery('#applitools-panel').hide();
        });

        jQuery('#eyes-app-name')
            .val(applitools.getAppName())
            .attr("placeholder", applitools.getDefaultAppName())
            .on('change', function () {
                var newValue = jQuery(this).val();
                applitools.setAppName(newValue)
            });

        jQuery('#eyes-test-name')
            .val(applitools.getTestName())
            .attr("placeholder", applitools.getDefaultTestName())
            .on('change', function () {
                var newValue = jQuery(this).val();
                applitools.setTestName(newValue)
            });

        jQuery('#ask-for-methods-title')
            .prop('checked', applitools.getIsAskForMethodsTitle())
            .on('change', function () {
                applitools.setIsAskForMethodsTitle(this.checked);
            });
    },

    controlButtons: {
        element: null,
        show: function() {
            jQuery('.button-applitools').show();
        },
        hide: function() {
            jQuery('.button-applitools').hide();
        }
    },

    settingsPanel: {
        element: null,
        show: function() {
            if (this.element) { return; }
            this.element = applitools.interface.settingsDialog;
            builder.dialogs.show(this.element);
            jQuery('#applitools_apikey').val(applitools.getApiKey() || '');
        },
        hide: function() {
            jQuery(this.element).remove();
            this.element = null;
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

    titlePrompt: function(defaultTitle) {
        var title = prompt(_t('__applitools_title_prompt'), defaultTitle);
        return title != null ? title : defaultTitle;
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