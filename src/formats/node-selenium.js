builder.selenium2.io.addLangFormatter({
    name: "Node.JS - Selenium-WebDriver (Applitools)",
    extension: ".js",
    not: "!",
    start:
    "var webdriver = require('selenium-webdriver'),\n" +
    "\tBy = webdriver.By,\n" +
    "\tuntil = webdriver.until;\n"+
    "var _ = require('underscore');\n"+
    "var VARS = {};\n" +
    "\n" +
    "var globalTimeout = {timeoutSeconds}*1000;\n"+
    "\n" +
    "var driver = new webdriver.Builder()\n" +
    "\t.withCapabilities(webdriver.Capabilities.firefox())\n" +
    "\t.build();\n" +
    "\n" +
    "var eyesSelenium = require('eyes.selenium');\n"+
    "var Eyes = eyesSelenium.Eyes,\n"+
    "\tImageMatchSettings = eyesSelenium.ImageMatchSettings,\n"+
    "\tMatchLevel = eyesSelenium.MatchLevel;\n"+
    "var eyes = new Eyes();\n"+
    "eyes.setApiKey('{applitoolsApiKey}');\n"+
    "eyes.setDefaultMatchSettings(new ImageMatchSettings({applitoolsMatchLevel}));\n"+
    "\n" +
    "driver.controlFlow().on('uncaughtException', function(err) {\n" +
    "\tconsole.log('There was an uncaught exception: ' + err);\n" +
    "});\n" +
    "\n" +
    "eyes.open(driver, '{applitoolsAppName}', '{applitoolsTestName}').then(function(driver) {\n",

    end:
    "\teyes.close();\n" +
    "\tdriver.quit();\n" +
    "});",

    applitoolsApiKey: function () {
        return applitools.getApiKey(true);
    },
    applitoolsAppName: function () {
        return applitools.getAppName(true);
    },
    applitoolsTestName: function () {
        return applitools.getTestName(true);
    },
    applitoolsMatchLevel: function () {
        return "MatchLevel." + applitools.getMatchLevel(true);
    },

    lineForType: {
        //--- applitools
        "eyes.checkWindow":
            "\teyes.checkWindow({title}); \n",
        "eyes.checkElement":
            "\teyes.checkRegionBy(By.{locatorBy}({locator}), {title}); \n",
        "eyes.checkRegion":
            "\teyes.checkRegion({width: {width}, height: {height}, top: {top}, left: {left}}, {title}); \n",
        "setViewportSize":
            "\teyes.setViewportSize({width: {width}, height: {height}});\n",
        //--- navigation
        "get" :
            "\tdriver.get({url}); \n",
        "refresh" :
            "\tdriver.navigate().refresh(); \n",
        "goBack" :
            "\tdriver.navigate().back(); \n",
        "goForward" :
            "\tdriver.navigate().forward(); \n",
        "close" :
            "\tdriver.quit(); \n",
        //--- input
        "clickElement" :
            "\tdriver.findElement(By.{locatorBy}({locator})).click(); \n",
        "doubleClickElement" :
            "\tdriver.actions().doubleClick(driver.findElement(By.{locatorBy}({locator}))).perform(); \n",
        "mouseOverElement" :
            "\tdriver.actions().mouseMove(driver.findElement(By.{locatorBy}({locator}))).perform(); \n",
        "setElementText" :
            "\tdriver.findElement(By.{locatorBy}({locator})).clear(); \n" +
            "\tdriver.findElement(By.{locatorBy}({locator})).sendKeys({text}); \n",
        "sendKeysToElement" :
            "\tdriver.findElement(By.{locatorBy}({locator})).sendKeys({text}); \n",
        "setElementSelected" :
            "\tdriver.findElement(By.{locatorBy}({locator})).isSelected().then(function(isSelected){  \n" +
            "\t\tif(!isSelected){  \n" +
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).click(); \n" +
            "\t\t} \n" +
            "\t}); \n",
        "setElementNotSelected" :
            "\tdriver.findElement(By.{locatorBy}({locator})).isSelected().then(function(isSelected){ \n" +
            "\t\tif(isSelected){ \n" +
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).click(); \n" +
            "\t\t} \n" +
            "\t}); \n",
        "clearSelections" :
            "",   //clear multi select element
        "submitElement" :
            "\tdriver.findElement(By.{locatorBy}({locator})).submit(); \n",
        "dragToAndDropElement" :
            "",   //{locator}-{targetLocator}
        "clickAndHoldElement" :
            "\tdriver.actions().mouseDown(driver.findElement(By.{locatorBy}({locator}))).perform(); \n",
        "releaseElement" :
            "\tdriver.actions().mouseUp(driver.findElement(By.{locatorBy}({locator}))).perform(); \n",
        //--- misc
        "addCookie" :
            "\tdriver.manage().addCookie({name}, {value}); \n", //path & max_age?
        "deleteCookie" :
            "\tdriver.manage().deleteCookie({name}); \n",
        "saveScreenshot" :
            "\tdriver.takeScreenshot().then(function (image, err) { \n" +
            "\t\trequire('fs').writeFile({file}, image, 'base64'); \n" +
            "\t}); \n",
        "print" :
            "\tdriver.controlFlow().execute(function () { console.log({text}); }); \n",
        "pause" :
            "\tdriver.sleep({waitTime}); \n",
        "switchToFrame" :
            "\tdriver.switchTo().frame({identifier}); \n",
        "switchToFrameByIndex" :
            "\tdriver.switchTo().frame({index}); \n",
        "switchToWindow" :
            "\tdriver.switchTo().window({name}); \n",
        "switchToWindowByIndex" :
            "\tdriver.getAllWindowHandles().then(function(handlesArray){ \n" +
            "\t\tdriver.switchTo().window(handlesArray[{index}]); \n" +
            "\t}); \n",
        "switchToDefaultContent" :
            "\tdriver.switchTo().defaultContent(); \n",
        "answerAlert":
            "\tdriver.switchTo().alert().sendKeys({text}); \n",
        "acceptAlert" :
            "\tdriver.switchTo().alert().accept(); \n",
        "dismissAlert" :
            "\tdriver.switchTo().alert().dismiss(); \n",
        //--- store
        "store":
            "\tdriver.controlFlow().execute(function () {  ${{variable}} = '' + {text}; }); \n"
    },
    assert: function(step, escapeValue, doSubs, getter) {
        if (step.negated) {
            return doSubs(
                "{getter}\n" +
                "\tif (_.isEqual({value},{cmp})) {\n" +
                "\t\tdriver.quit();\n" +
                "\t\tthrow new Error('!{stepTypeName} failed');\n" +
                "\t}\n" +
                "{getterFinish}\n", getter);
        } else {
            return doSubs(
                "{getter}\n" +
                "\tif (!_.isEqual({value}, {cmp})) {\n" +
                "\t\tdriver.quit();\n" +
                "\t\tthrow new Error('{stepTypeName} failed');\n" +
                "\t}\n" +
                "{getterFinish}\n", getter);
        }
    },
    verify: function(step, escapeValue, doSubs, getter) {
        if (step.negated) {
            return doSubs(
                "{getter}\n" +
                "\tif (_.isEqual({value}, {cmp})) {\n" +
                "\t\tconsole.log('!{stepTypeName} failed');\n" +
                "\t}\n" +
                "{getterFinish}\n", getter);
        } else {
            return doSubs(
                "{getter}\n" +
                "\tif (!_.isEqual({value}, {cmp})) {\n" +
                "\t\tconsole.log('{stepTypeName} failed');\n" +
                "\t}\n" +
                "{getterFinish}\n", getter);
        }
    },
    waitFor: function(step, escapeValue, doSubs, getter) {
        return doSubs(
            "driver.wait(function(){ \n" +
            "\treturn {getter} \n" +
            "\t\treturn ({negNot}_.isEqual({value}, {cmp})); \n" +
            "\t{getterFinish} \n" +
            "}, globalTimeout); \n", getter);
    },
    store:
    "{getter}\n" +
    "\t${{variable}} = {value};\n" +
    "{getterFinish}\n",
    boolean_assert:
    "{getter}\n" +
    "\tif ({posNot}{value}) {\n" +
    "\t\tdriver.quit();\n" +
    "\t\tthrow new Error('{negNot}{stepTypeName} failed');\n" +
    "\t}\n" +
    "{getterFinish}\n",
    boolean_verify:
    "{getter}\n" +
    "\tif ({posNot}{value}) {\n" +
    "\t\tdriver.quit();\n" +
    "\t\tconsole.log('{negNot}{stepTypeName} failed');\n" +
    "\t}\n" +
    "{getterFinish}\n",
    boolean_waitFor: "",
    boolean_store:
    "{getter}\n" +
    "\t${{variable}} = {value};" +
    "{getterFinish}\n",
    boolean_getters: {
        "TextPresent": {
            getter: "driver.findElement(By.tagName('html')).getText().then(function (text) {\n" +
            "\tvar hasText = text.indexOf({text}) !== -1;",
            getterFinish: "});",
            value: "hasText"
        },
        "ElementPresent": {
            getter: "driver.isElementPresent(driver.findElement(By.{locatorBy}({locator}))).then(function (isPresent) {",
            getterFinish: "});",
            value: "isPresent"
        },
        "ElementSelected": {
            getter: "driver.findElement(By.{locatorBy}({locator})).isSelected().then(function (isSelected) {",
            getterFinish: "});",
            value: "isSelected"
        },
        "CookiePresent": {
            getter: "driver.manage().getCookie({name}).then(function (cookie) {\n" +
            "\tvar hasCookie = (cookie !== null);",
            getterFinish: "});",
            value: "hasCookie"
        },
        "AlertPresent": {
            getter: "driver.switchTo().alert().thenCatch(function (e) {\n" +
            "\tvar hasAlert = (e.code !== 27);",
            getterFinish: "});",
            value: "hasAlert"
        }
    },
    getters: {
        "BodyText": {
            getter: "driver.findElement(By.tagName('html')).getText().then(function (text) {",
            getterFinish: "});",
            cmp: "{text}",
            value: "text"
        },
        "PageSource": {
            getter: "driver.getPageSource().then(function (source) {",
            getterFinish: "});",
            cmp: "{source}",
            value: "source"
        },
        "CurrentUrl": {
            getter: "driver.getCurrentUrl().then(function (url) {",
            getterFinish: "});",
            cmp: "{url}",
            value: "url"
        },
        "Title": {
            getter: "driver.getTitle().then(function (title) {",
            getterFinish: "});",
            cmp: "{title}",
            value: "title"
        },
        "Text": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getText().then(function (text) {",
            getterFinish: "});",
            cmp: "{text}",
            value: "text"
        },
        "ElementValue": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getAttribute('value').then(function (value) {",
            getterFinish: "});",
            cmp: "{value}",
            value: "value"
        },
        "ElementAttribute": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getAttribute({attributeName}).then(function (value) {",
            getterFinish: "});",
            cmp: "{value}",
            value: "value"
        },
        "ElementStyle": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getCssValue({propertyName}).then(function (value) {",
            getterFinish: "});",
            cmp: "{value}",
            value: "value"
        },
        "CookieByName": {
            getter: "driver.manage().getCookie({name}).then(function (cookie) {",
            getterFinish: "});",
            cmp: "{value}",
            value: "cookie"
        },
        "AlertText": {
            getter: "driver.switchTo().alert().getText().then(function (text) {",
            getterFinish: "});",
            cmp: "{text}",
            value: "text"
        },
        "Eval": {
            getter: "driver.executeScript({script}).then(function (value) {",
            getterFinish: "});",
            cmp: "{value}",
            value: "value"
        }
    },

    locatorByForType: function(stepType, locatorType, locatorIndex) {
        if(locatorType === "id"){ return "id"; }
        if(locatorType === "name"){ return "name"; }
        if(locatorType === "link text"){ return "linkText"; }
        if(locatorType === "css selector"){ return "css"; }
        if(locatorType === "xpath"){ return "xpath"; }
    },

    /**
     * Processes a parameter value into an appropriately escaped expression. Mentions of variables
     * with the ${foo} syntax are transformed into expressions that concatenate the variables and
     * literals.
     * For example:
     * a${b}c
     * becomes:
     * "a" + b + "c"
     */
    escapeValue: function(stepType, value, pName) {
        var keysMap = {
            "NULL": "\\uE000",
            "CANCEL": "\\uE001",
            "HELP": "\\uE002",
            "BACK_SPACE": "\\uE003",
            "TAB": "\\uE004",
            "CLEAR": "\\uE005",
            "RETURN": "\\uE006",
            "ENTER": "\\uE007",
            "SHIFT": "\\uE008",
            "LEFT_SHIFT": "\\uE008",
            "CONTROL": "\\uE009",
            "LEFT_CONTROL": "\\uE009",
            "ALT": "\\uE00A",
            "LEFT_ALT": "\\uE00A",
            "PAUSE": "\\uE00B",
            "ESCAPE": "\\uE00C",
            "SPACE": "\\uE00D",
            "PAGE_UP": "\\uE00E",
            "PAGE_DOWN": "\\uE00F",
            "END": "\\uE010",
            "HOME": "\\uE011",
            "LEFT": "\\uE012",
            "ARROW_LEFT": "\\uE012",
            "UP": "\\uE013",
            "ARROW_UP": "\\uE013",
            "RIGHT": "\\uE014",
            "ARROW_RIGHT": "\\uE014",
            "DOWN": "\\uE015",
            "ARROW_DOWN": "\\uE015",
            "INSERT": "\\uE016",
            "DELETE": "\\uE017",
            "SEMICOLON": "\\uE018",
            "EQUALS": "\\uE019",
            "NUMPAD0": "\\uE01A",
            "NUMPAD1": "\\uE01B",
            "NUMPAD2": "\\uE01C",
            "NUMPAD3": "\\uE01D",
            "NUMPAD4": "\\uE01E",
            "NUMPAD5": "\\uE01F",
            "NUMPAD6": "\\uE020",
            "NUMPAD7": "\\uE021",
            "NUMPAD8": "\\uE022",
            "NUMPAD9": "\\uE023",
            "MULTIPLY": "\\uE024",
            "ADD": "\\uE025",
            "SEPARATOR": "\\uE026",
            "SUBTRACT": "\\uE027",
            "DECIMAL": "\\uE028",
            "DIVIDE": "\\uE029",
            "F1": "\\uE031",
            "F2": "\\uE032",
            "F3": "\\uE033",
            "F4": "\\uE034",
            "F5": "\\uE035",
            "F6": "\\uE036",
            "F7": "\\uE037",
            "F8": "\\uE038",
            "F9": "\\uE039",
            "F10": "\\uE03A",
            "F11": "\\uE03B",
            "F12": "\\uE03C",
            "META": "\\uE03D",
            "COMMAND": "\\uE03D",
            "ZENKAKU_HANKAKU": "\\uE040"
        };

        if (stepType.name.startsWith("store") && pName == "variable") { return value; }
        if (stepType.name == "switchToFrameByIndex" && pName == "index") { return value; }
        // This function takes a string literal and escapes it and wraps it in quotes.
        var esc = function(v) { return "\"" + v.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\""; };

        // Don't escape numerical values.
        if (stepType == builder.selenium2.stepTypes.pause || pName == "left" || pName == "top" || pName == "width" || pName == "height") {
            esc = function(v) { return v; };
        }

        // The following is a transducer that produces the escaped expression by going over each
        // character of the input.
        var output = "";       // Escaped expression.
        var lastChunk = "";    // Accumulates letters of the current literal.
        var hasDollar = false; // Whether we've just encountered a $ character.
        var insideVar = false; // Whether we are reading in the name of a variable.
        var varName = "";      // Accumulates letters of the current variable.
        var hasBang = false;   // Whether we've just encountered a ! character.
        var insideKey = false; // Whether we're reading a key escape sequence.
        var keyName = "";      // Accumulates letters of the current key.

        for (var i = 0; i < value.length; i++) {
            var ch = value.substring(i, i + 1);
            if (insideVar) {
                if (ch == "}") {
                    // We've finished reading in the name of a variable.
                    // If this isn't the start of the expression, use + to concatenate it.
                    if (output.length > 0) { output += " + "; }
                    output += "VARS." + varName;
                    insideVar = false;
                    hasDollar = false;
                    varName = "";
                } else {
                    // This letter is part of the name of the variable we're reading in.
                    varName += ch;
                }
            } else if (insideKey) {
                if (ch == "}") {
                    // We've finished reading in the name of a key.
                    // If this isn't the start of the expression, use + to concatenate it.
                    if (output.length > 0) { output += " + "; }
                    output += "\"" + keysMap[keyName] + "\"";
                    insideKey = false;
                    hasBang = false;
                    keyName = "";
                } else {
                    // This letter is part of the name of the key we're reading in.
                    keyName += ch;
                }
            } else {
                // We're not currently reading in the name of a variable.
                if (hasDollar) {
                    // But we *have* just encountered a $, so if this character is a {, we are about to
                    // do a variable.
                    if (ch == "{") {
                        insideVar = true;
                        if (lastChunk.length > 0) {
                            // Add the literal we've read in to the text.
                            if (output.length > 0) { output += " + "; }
                            output += esc(lastChunk);
                        }
                        lastChunk = "";
                    } else {
                        // No, it was just a lone $.
                        hasDollar = false;
                        lastChunk += "$" + ch;
                    }
                } else if (hasBang) {
                    // But we *have* just encountered a !, so if this character is a {, we are about to
                    // do a key.
                    if (ch == "{") {
                        insideKey = true;
                        if (lastChunk.length > 0) {
                            // Add the literal we've read in to the text.
                            if (output.length > 0) { output += " + "; }
                            output += esc(lastChunk);
                        }
                        lastChunk = "";
                    } else {
                        // No, it was just a lone !.
                        hasBang = false;
                        lastChunk += "!" + ch;
                    }
                } else {
                    // This is the "normal case" - accumulating the letters of a literal. Unless the letter
                    // is a $, in which case this may be the start of a variable. Or a !, in which case it
                    // may be part of a key.
                    if (ch == "$") {
                        hasDollar = true;
                    } else if (ch == "!") {
                        hasBang = true;
                    } else {
                        lastChunk += ch;
                    }
                }
            }
        }
        // Append the final literal, if any, to the output.
        if (lastChunk.length > 0) {
            if (output.length > 0) { output += " + "; }
            output += esc(lastChunk);
        }
        return output;
    },
    usedVar: function(varName, varType) { return "VARS." + varName; },
    unusedVar: function(varName, varType) { return "VARS." + varName; }
});
