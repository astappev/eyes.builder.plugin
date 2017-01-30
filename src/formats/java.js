builder.selenium2.io.addLangFormatter({
    name: "Java (Applitools)",
    extension: ".java",
    not: "!",
    start: "import java.util.concurrent.TimeUnit;\n" +
    "import java.util.Date;\n" +
    "import java.io.File;\n" +
    "import java.net.URISyntaxException;\n" +
    "import com.applitools.eyes.Eyes;\n" +
    "import com.applitools.eyes.RectangleSize;\n" +
    "import org.openqa.selenium.support.ui.Select;\n" +
    "import org.openqa.selenium.interactions.Actions;\n" +
    "import org.openqa.selenium.firefox.FirefoxDriver;\n" +
    "import org.openqa.selenium.*;\n" +
    "import static org.openqa.selenium.OutputType.*;\n" +
    "\n" +
    "public class {scriptName} {\n" +
    "\tpublic static void main(String[] args) throws URISyntaxException, InterruptedException {\n" +
    "\t\tWebDriver driver = new FirefoxDriver();\n" +
    "\t\t{initDriver}\n" +
    "\t\tdriver.manage().timeouts().implicitlyWait({timeoutSeconds}, TimeUnit.SECONDS);\n" +
    "\t\tEyes eyes = new Eyes();\n" +
    "\t\teyes.setApiKey('" + applitools.getApiKey(true) + "');\n" +
    "\t\ttry {\n" +
    "\t\t\tdriver = eyes.open(driver, '" + applitools.getAppName(true) + "', '" + applitools.getTestName(true) + "');\n\n",
    end: "\n" +
    "\t\t\teyes.close();\n" +
    "\t\t} finally {\n" +
    "\t\t\teyes.abortIfNotClosed()\n" +
    "\t\t\tdriver.quit();\n" +
    "\t\t}\n" +
    "\t}\n" +
    "\t\n" +
    "\tpublic static boolean isAlertPresent(FirefoxDriver driver) {\n" +
    "\t\ttry {\n" +
    "\t\t\tdriver.switchTo().alert();\n" +
    "\t\t\treturn true;\n" +
    "\t\t} catch (NoAlertPresentException e) {\n" +
    "\t\t\treturn false;\n" +
    "\t\t}\n" +
    "\t}\n" +
    "}\n",
    lineForType: {
        //--- applitools
        "eyes.checkWindow":
            "\t\t\teyes.checkWindow({title}); \n",
        "eyes.checkElement":
            "\t\t\teyes.checkRegion(By.{locatorBy}({locator}), {title}); \n",
        "eyes.checkRegion":
            "\t\t\teyes.checkRegion(new Region({left}, {top}, {width}, {height}), -1, {title}); \n",
        "setViewportSize":
            "\t\t\teyes.setViewportSize(new RectangleSize({width}, {height}));\n",
        //--- navigation
        "get":
            "\t\t\tdriver.get({url});\n",
        "refresh":
            "\t\t\tdriver.navigate().refresh();\n",
        "goBack":
            "\t\t\tdriver.navigate().back();\n",
        "goForward":
            "\t\t\tdriver.navigate().forward();\n",
        "close":
            "\t\t\tdriver.close();\n",
        //--- input
        "clickElement":
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).click();\n",
        "doubleClickElement":
            "\t\t\tnew Actions(driver).doubleClick(driver.findElement(By.{locatorBy}({locator}))).build().perform();\n",
        "mouseOverElement":
            "\t\t\tnew Actions(driver).moveToElement(driver.findElement(By.{locatorBy}({locator}))).build().perform();\n",
        "setElementText":
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).click();\n" +
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).clear();\n" +
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).sendKeys({text});\n",
        "sendKeysToElement":
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).click();\n" +
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).sendKeys({text});\n",
        "setElementSelected":
            "\t\t\tif (!driver.findElement(By.{locatorBy}({locator})).isSelected()) {\n" +
            "\t\t\t\tdriver.findElement(By.{locatorBy}({locator})).click();\n" +
            "\t\t\t}\n",
        "setElementNotSelected":
            "\t\t\tif (driver.findElement(By.{locatorBy}({locator})).isSelected()) {\n" +
            "\t\t\t\tdriver.findElement(By.{locatorBy}({locator})).click();\n" +
            "\t\t\t}\n",
        "clearSelections":
            "\t\t\tnew Select(driver.findElement(By.{locatorBy}({locator}))).deselectAll();\n",
        "submitElement":
            "\t\t\tdriver.findElement(By.{locatorBy}({locator})).submit();\n",
        "dragToAndDropElement":
            "\t\t\tnew Actions(driver).dragAndDrop(driver.findElement(By.{locatorBy}({locator})), driver.findElement(By.{locator2By}({locator2}))).build().perform();\n",
        "clickAndHoldElement":
            "\t\t\tnew Actions(driver).clickAndHold(driver.findElement(By.{locatorBy}({locator}))).build.perform();\n",
        "releaseElement":
            "\t\t\tnew Actions(driver).release(driver.findElement(By.{locatorBy}({locator}))).build.perform();\n",
        //--- misc
        "addCookie": function (step, escapeValue) {
            var r = "\t\t\tCookie c" + step.id + " = new Cookie.Builder(" + escapeValue(step.type, step.name) + ", " + escapeValue(step.type, step.value) + ")";
            var opts = step.options.split(",");
            for (var i = 0; i < opts.length; i++) {
                var kv = opts[i].trim().split("=");
                if (kv.length == 1) {
                    continue;
                }
                if (kv[0] == "path") {
                    r += ".path(" + escapeValue(step.type, kv[1]) + ")";
                }
                if (kv[0] == "max_age") {
                    r += ".expiresOn(new Date(new Date().getTime() + " + parseInt(kv[1]) * 1000 + "l))";
                }
            }
            r += ".build();\n";
            r += "\t\t\tdriver.manage().addCookie(c" + step.id + ");\n";
            return r;
        },
        "deleteCookie": function (step, escapeValue) {
            return (
            "\t\t\tCookie c" + step.id + " = driver.manage().getCookieNamed(" + escapeValue(step.type, step.name) + ");\n" +
            "\t\t\tif (c" + step.id + " != null) { driver.manage().deleteCookie(c" + step.id + "); }\n");
        },
        "saveScreenshot":
            "\t\t\tdriver.getScreenshotAs(FILE).renameTo(new File({file}));\n",
        "print":
            "\t\t\tSystem.out.println({text});\n",
        "pause":
            "\t\t\ttry { Thread.sleep({waitTime}l); } catch (Exception e) { throw new RuntimeException(e); }\n",
        "switchToFrame":
            "\t\t\tdriver = (FirefoxDriver) driver.switchTo().frame({identifier});\n",
        "switchToFrameByIndex":
            "\t\t\tdriver = (FirefoxDriver) driver.switchTo().frame({index});\n",
        "switchToWindow":
            "\t\t\tdriver = (FirefoxDriver) driver.switchTo().window({name});\n",
        "switchToDefaultContent":
            "\t\t\tdriver = (FirefoxDriver) driver.switchTo().switchToDefaultContent();\n",
        "answerAlert":
            "\t\t\tdriver.switchTo().alert().sendKeys({text});\n" +
            "\t\t\tdriver.switchTo().alert().accept();\n",
        "acceptAlert":
            "\t\t\tdriver.switchTo().alert().accept();\n",
        "dismissAlert":
            "\t\t\tdriver.switchTo().alert().dismiss();\n",
        //--- store
        "store": "\t\t\t${{variable}:String} = \"\" + {text};\n"
    },

    locatorByForType: function (stepType, locatorType, locatorIndex) {
        if ({"select.select": 1, "select.deselect": 1}[stepType.name] && locatorIndex == 2) {
            return {
                "index": "ByIndex",
                "value": "ByValue",
                "label": "ByVisibleText",
                "id": "[NOT IMPLEMENTED]"
            };
        }
        return {
            "class name": "className",
            "id": "id",
            "link text": "linkText",
            "xpath": "xpath",
            "css selector": "cssSelector",
            "name": "name",
            "tag name": "tagName",
            "partial link text": "partialLinkText"
        }[locatorType];
    },
    assert: function (step, escapeValue, doSubs, getter) {
        if (step.negated) {
            return doSubs(
                "\t\t\tif ({getter}.equals({cmp})) {\n" +
                "\t\t\t\tdriver.close();\n" +
                "\t\t\t\tthrow new RuntimeException(\"!{stepTypeName} failed\");\n" +
                "\t\t\t}\n", getter);
        } else {
            return doSubs(
                "\t\t\tif (!{getter}.equals({cmp})) {\n" +
                "\t\t\t\tdriver.close();\n" +
                "\t\t\t\tthrow new RuntimeException(\"{stepTypeName} failed\");\n" +
                "\t\t\t}\n", getter);
        }
    },
    verify: function (step, escapeValue, doSubs, getter) {
        if (step.negated) {
            return doSubs(
                "\t\t\tif ({getter}.equals({cmp})) {\n" +
                "\t\t\t\tSystem.out.println(\"!{stepTypeName} failed\");\n" +
                "\t\t\t}\n", getter);
        } else {
            return doSubs(
                "\t\t\tif (!{getter}.equals({cmp})) {\n" +
                "\t\t\t\tSystem.out.println(\"{stepTypeName} failed\");\n" +
                "\t\t\t}\n", getter);
        }
    },
    waitFor: "",
    store: "\t\t\t${{variable}:{vartype}} = {getter};\n",
    boolean_assert: "\t\t\tif ({posNot}{getter}) {\n" +
    "\t\t\t\tdriver.close();\n" +
    "\t\t\t\tthrow new RuntimeException(\"{negNot}{stepTypeName} failed\");\n" +
    "\t\t\t}\n",
    boolean_verify: "\t\t\tif ({posNot}{getter}) {\n" +
    "\t\t\t\tSystem.out.println(\"{negNot}{stepTypeName} failed\");\n" +
    "\t\t\t}\n",
    boolean_waitFor: "",
    boolean_store: "\t\t\t${{variable}:{vartype}} = {getter};\n",
    boolean_getters: {
        "TextPresent": {
            getter: "driver.findElement(By.tagName(\"html\")).getText().contains({text})",
            vartype: "boolean"
        },
        "ElementPresent": {
            getter: "(driver.findElements(By.{locatorBy}({locator})).size() != 0)",
            vartype: "boolean"
        },
        "ElementSelected": {
            getter: "(driver.findElement(By.{locatorBy}({locator})).isSelected())",
            vartype: "boolean"
        },
        "CookiePresent": {
            getter: "(driver.manage().getCookieNamed({name}) != null)",
            vartype: "boolean"
        },
        "AlertPresent": {
            getter: "isAlertPresent(driver)",
            vartype: "boolean"
        }
    },
    getters: {
        "BodyText": {
            getter: "driver.findElement(By.tagName(\"html\")).getText()",
            cmp: "{text}",
            vartype: "String"
        },
        "PageSource": {
            getter: "driver.getPageSource()",
            cmp: "{source}",
            vartype: "String"
        },
        "Text": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getText()",
            cmp: "{text}",
            vartype: "String"
        },
        "CurrentUrl": {
            getter: "driver.getCurrentUrl()",
            cmp: "{url}",
            vartype: "String"
        },
        "Title": {
            getter: "driver.getTitle()",
            cmp: "{title}",
            vartype: "String"
        },
        "ElementValue": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getAttribute(\"value\")",
            cmp: "{value}",
            vartype: "String"
        },
        "ElementAttribute": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getAttribute({attributeName})",
            cmp: "{value}",
            vartype: "String"
        },
        "ElementStyle": {
            getter: "driver.findElement(By.{locatorBy}({locator})).getCssValue({propertyName})",
            cmp: "{value}",
            vartype: "String"
        },
        "CookieByName": {
            getter: "driver.manage().getCookieNamed({name}).getValue()",
            cmp: "{value}",
            vartype: "String"
        },
        "AlertText": {
            getter: "driver.switchTo().alert().getText()",
            cmp: "{text}",
            vartype: "String"
        },
        "Eval": {
            getter: "driver.executeScript({script})",
            cmp: "{value}",
            vartype: "String"
        }
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
    escapeValue: function (stepType, value, pName) {
        if (stepType.name.startsWith("store") && pName == "variable") {
            return value;
        }
        if (stepType.name == "switchToFrameByIndex" && pName == "index") {
            return value;
        }
        // This function takes a string literal and escapes it and wraps it in quotes.
        var esc = function (v) {
            var escapedValue = "\"" + v.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
            return escapedValue.replace(/\n/g, '\\n');
        };

        // Don't escape numerical values.
        if (stepType == builder.selenium2.stepTypes.pause || stepType == builder.selenium2.stepTypes.setWindowSize) {
            esc = function (v) {
                return v;
            }
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
                    if (output.length > 0) {
                        output += " + ";
                    }
                    output += varName;
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
                    if (output.length > 0) {
                        output += " + ";
                    }
                    output += "Keys." + keyName;
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
                            if (output.length > 0) {
                                output += " + ";
                            }
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
                            if (output.length > 0) {
                                output += " + ";
                            }
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
            if (output.length > 0) {
                output += " + ";
            }
            output += esc(lastChunk);
        }
        return output;
    },
    usedVar: function (varName, varType) {
        return varName;
    },
    unusedVar: function (varName, varType) {
        return varType + " " + varName;
    }
});
