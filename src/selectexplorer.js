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

    this.widget = {
        window: null,
        document: null,
        root: null,
        body: null,
        overlay: null,
        selection: null,
        selection_inner: null,
        selection_top: null,
        selection_bottom: null,
        selection_left: null,
        selection_right: null
    };

    var setting = {
        min_height: 4,
        min_width: 4,
        scroll_factor: 0.5
    };

    var getPosition = function (element) {
        var result = {
            top: element.offsetTop,
            left: element.offsetLeft,
            width: element.offsetWidth,
            height: element.offsetHeight
        };
        var parent = element.offsetParent;

        while (parent != null) {
            result.left += parent.offsetLeft;
            result.top += parent.offsetTop;

            parent = parent.offsetParent;
        }

        return result;
    };

    var that = this;
    var bindEvent = function (target, event, listener) {
        target.addEventListener(event, listener, false);
    };

    var unbindEvent = function (target, event, listener) {
        target.removeEventListener(event, listener, false);
    };

    var stopPropagation = function (event) {
        if (event.preventDefault) {
            event.preventDefault();
        }

        event.stopPropagation();
    };

    var scrollToY = function (min_y, max_y) {
        var scroll_up = Math.round((24 - min_y + that.widget.root.scrollTop) * setting.scroll_factor);
        var scroll_down = Math.round((24 + max_y - that.widget.overlay.offsetHeight - that.widget.root.scrollTop) * setting.scroll_factor);

        if (scroll_up > 0) {
            that.widget.root.scrollTop -= scroll_up;
        } else if (scroll_down > 0) {
            that.widget.root.scrollTop += scroll_down;
        }
    };

    var scrollToX = function (min_x, max_x) {
        var scroll_left = Math.round((24 - min_x + that.widget.root.scrollLeft) * setting.scroll_factor);
        var scroll_down = Math.round((24 + max_x - that.widget.overlay.offsetWidth - that.widget.root.scrollLeft) * setting.scroll_factor);

        if (scroll_left > 0) {
            that.widget.root.scrollLeft -= scroll_left;
        } else if (scroll_down > 0) {
            that.widget.root.scrollLeft += scroll_down;
        }
    };

    var actionMove = function (event) {
        var stop = function () {
            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            var position = getPosition(that.widget.selection);
            var left = (event.pageX + offsetX);
            var top = (event.pageY + offsetY);
            var height = position.height;
            var width = position.width;

            if (left < 0) left = 0;
            if (top < 0) top = 0;

            if (left + width > that.widget.root.scrollWidth) {
                left = that.widget.root.scrollWidth - width;
            }

            if (top + height > that.widget.root.scrollHeight) {
                top = that.widget.root.scrollHeight - height;
            }

            scrollToY(top, top + height);
            scrollToX(left, left + width);

            that.widget.selection.style.left = left + 'px';
            that.widget.selection.style.top = top + 'px';
        };

        var position = getPosition(that.widget.selection);
        var offsetX = position.left - event.pageX;
        var offsetY = position.top - event.pageY;

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    var initSelectionTop = function (event) {
        var selection = getPosition(that.widget.selection);

        return {
            selection: selection,
            offset: selection.top - event.pageY,
            height: selection.height + selection.top
        };
    };

    var initSelectionBottom = function (event) {
        var selection = getPosition(that.widget.selection);

        return {
            selection: selection,
            offset: selection.height - event.pageY
        };
    };

    var initSelectionLeft = function (event) {
        var selection = getPosition(that.widget.selection);

        return {
            selection: selection,
            offset: selection.left - event.pageX,
            width: selection.width + selection.left
        };
    };

    var initSelectionRight = function (event) {
        var selection = getPosition(that.widget.selection);

        return {
            selection: selection,
            offset: selection.width - event.pageX
        };
    };

    var setSelectionTop = function (event, context) {
        var top = event.pageY + context.offset;
        var height = context.height;

        if (top < 0) top = 0;

        if (height - top < setting.min_height) {
            height = setting.min_height;
            top = context.height - height;
        } else {
            height -= top;
        }

        scrollToY(event.pageY, event.pageY);

        that.widget.selection.style.height = height + 'px';
        that.widget.selection.style.top = top + 'px';
    };

    var setSelectionBottom = function (event, context) {
        var height = (event.pageY + context.offset);

        if (height < setting.min_height) {
            height = setting.min_height;
        }

        if (context.selection.top + height > that.widget.root.scrollHeight) {
            height = that.widget.root.scrollHeight - context.selection.top;
        }

        scrollToY(event.pageY, event.pageY);

        that.widget.selection.style.height = height + 'px';
    };

    var setSelectionLeft = function (event, context) {
        var left = event.pageX + context.offset;
        var width = context.width;

        if (left < 0) left = 0;

        if (width - left < setting.min_width) {
            width = setting.min_width;
            left = context.width - width;
        }

        else {
            width -= left;
        }

        scrollToX(event.pageX, event.pageX);

        that.widget.selection.style.width = width + 'px';
        that.widget.selection.style.left = left + 'px';
    };

    var setSelectionRight = function (event, context) {
        var width = (event.pageX + context.offset);

        if (width < setting.min_width) {
            width = setting.min_width;
        }

        if (context.selection.left + width > that.widget.root.scrollWidth) {
            width = that.widget.root.scrollWidth - context.selection.left;
        }

        scrollToX(event.pageX, event.pageX);

        that.widget.selection.style.width = width + 'px';
    };

    // Resize top:
    var actionTop = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-top');
            that.widget.selection.setAttribute('state', 'resize-top');

            setSelectionTop(event, context_top);
        };

        var context_top = initSelectionTop(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize top left:
    var actionTopLeft = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-top-left');
            that.widget.selection.setAttribute('state', 'resize-top-left');

            setSelectionTop(event, context_top);
            setSelectionLeft(event, context_left);
        };

        var context_top = initSelectionTop(event);
        var context_left = initSelectionLeft(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize top right:
    var actionTopRight = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-top-right');
            that.widget.selection.setAttribute('state', 'resize-top-right');

            setSelectionTop(event, context_top);
            setSelectionRight(event, context_right);
        };

        var context_top = initSelectionTop(event);
        var context_right = initSelectionRight(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize bottom:
    var actionBottom = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-bottom');
            that.widget.selection.setAttribute('state', 'resize-bottom');

            setSelectionBottom(event, context_bottom);
        };

        var context_bottom = initSelectionBottom(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize bottom left:
    var actionBottomLeft = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-bottom-left');
            that.widget.selection.setAttribute('state', 'resize-bottom-left');

            setSelectionBottom(event, context_bottom);
            setSelectionLeft(event, context_left);
        };

        var context_bottom = initSelectionBottom(event);
        var context_left = initSelectionLeft(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize bottom right:
    var actionBottomRight = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-bottom-right');
            that.widget.selection.setAttribute('state', 'resize-bottom-right');

            setSelectionBottom(event, context_bottom);
            setSelectionRight(event, context_right);
        };

        var context_bottom = initSelectionBottom(event);
        var context_right = initSelectionRight(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize left:
    var actionLeft = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-left');
            that.widget.selection.setAttribute('state', 'resize-left');

            setSelectionLeft(event, context_left);
        };

        var context_left = initSelectionLeft(event);

        unbindEvent(that.widget.selection, 'mousemove', move);
        unbindEvent(that.widget.selection, 'mouseup', stop);
        unbindEvent(that.widget.overlay, 'mousemove', move);
        unbindEvent(that.widget.overlay, 'mouseup', stop);
        unbindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize right:
    var actionRight = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'resize-right');
            that.widget.selection.setAttribute('state', 'resize-right');

            setSelectionRight(event, context_right);
        };

        var context_right = initSelectionRight(event);

        bindEvent(that.widget.selection, 'mousemove', move);
        bindEvent(that.widget.selection, 'mouseup', stop);
        bindEvent(that.widget.overlay, 'mousemove', move);
        bindEvent(that.widget.overlay, 'mouseup', stop);
        bindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Select:
    var actionAll = function (event) {
        var stop = function () {
            that.widget.overlay.setAttribute('state', '');
            that.widget.selection.setAttribute('state', '');

            unbindEvent(that.widget.selection, 'mousemove', move);
            unbindEvent(that.widget.selection, 'mouseup', stop);
            unbindEvent(that.widget.overlay, 'mousemove', move);
            unbindEvent(that.widget.overlay, 'mouseup', stop);
            unbindEvent(that.widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            that.widget.overlay.setAttribute('state', 'selecting');
            that.widget.selection.setAttribute('state', 'selecting');

            var width, height, top, left;
            if (start.x < event.pageX) {
                width = event.pageX - start.x;
                left = start.x;
            } else {
                width = start.x - event.pageX;
                left = event.pageX;
            }

            if (start.y < event.pageY) {
                height = event.pageY - start.y;
                top = start.y;
            } else {
                height = start.y - event.pageY;
                top = event.pageY;
            }

            if (width < 4) width = 4;
            if (height < 4) height = 4;

            scrollToY(event.pageY, event.pageY);
            scrollToX(event.pageX, event.pageX);

            that.widget.selection.style.top = top + 'px';
            that.widget.selection.style.left = left + 'px';
            that.widget.selection.style.width = width + 'px';
            that.widget.selection.style.height = height + 'px';
        };

        var start = {
            x: event.pageX,
            y: event.pageY
        };

        bindEvent(that.widget.selection, 'mousemove', move);
        bindEvent(that.widget.selection, 'mouseup', stop);
        bindEvent(that.widget.overlay, 'mousemove', move);
        bindEvent(that.widget.overlay, 'mouseup', stop);
        bindEvent(that.widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    var actionKeyDown = function (event) {
        if (event.keyCode == 27) actionClose();
        else if (event.keyCode == 13) actionSave();
        else return;

        unbindEvent(that.widget.window, 'keydown', actionKeyDown);
        this.stopPropagation(event);
    };

    var actionClick = function (event) {
        this.stopPropagation(event);
    };

    var actionSave = function (event) {
        var region = getPosition(that.widget.selection);
        that.recordStep(region);
        stopPropagation(event);
    };

    var actionClose = function (event) {
        unbindEvent(that.widget.window, 'unload', actionClose);
        unbindEvent(that.widget.window, 'keydown', actionKeyDown);
        unbindEvent(that.widget.window, 'click', actionClick);
        unbindEvent(that.widget.overlay, 'mousedown', actionAll);
        unbindEvent(that.widget.selection, 'mousedown', actionMove);
        unbindEvent(that.widget.selection, 'dblclick', actionSave);

        that.widget.root.removeChild(styles);
        that.widget.root.removeChild(that.widget.overlay);
        that.widget.root.removeChild(that.widget.selection);
        if (event) {
            stopPropagation(event);
        }
    };

    this.close = function () {
        actionClose();
    };

    // Define widgets:
    this.widget.document = top_window.document;
    this.widget.window = this.widget.document.defaultView;

    var styles = this.widget.document.createElement('style');
    styles.type = 'text/css';
    var path = builder.plugins.getResourcePath('applitools', 'widgetstyles.css');
    interface.loadStylesFromFile(path, styles);

    this.widget.root = this.widget.document.documentElement;
    this.widget.overlay = this.widget.document.createElement('selectWidget-overlay');
    this.widget.selection = this.widget.document.createElement('selectWidget-selection');
    this.widget.selection_inner = this.widget.document.createElement('selectWidget-selection-inner');
    this.widget.selection_top = this.widget.document.createElement('selectWidget-selection-top');
    this.widget.selection_top_left = this.widget.document.createElement('selectWidget-selection-top-left');
    this.widget.selection_top_right = this.widget.document.createElement('selectWidget-selection-top-right');
    this.widget.selection_bottom = this.widget.document.createElement('selectWidget-selection-bottom');
    this.widget.selection_bottom_left = this.widget.document.createElement('selectWidget-selection-bottom-left');
    this.widget.selection_bottom_right = this.widget.document.createElement('selectWidget-selection-bottom-right');
    this.widget.selection_left = this.widget.document.createElement('selectWidget-selection-left');
    this.widget.selection_right = this.widget.document.createElement('selectWidget-selection-right');

    this.widget.root.appendChild(styles);
    this.widget.root.appendChild(this.widget.overlay);
    this.widget.root.appendChild(this.widget.selection);
    this.widget.selection.appendChild(this.widget.selection_inner);
    this.widget.selection_inner.appendChild(this.widget.selection_top);
    this.widget.selection_inner.appendChild(this.widget.selection_top_left);
    this.widget.selection_inner.appendChild(this.widget.selection_top_right);
    this.widget.selection_inner.appendChild(this.widget.selection_bottom);
    this.widget.selection_inner.appendChild(this.widget.selection_bottom_left);
    this.widget.selection_inner.appendChild(this.widget.selection_bottom_right);
    this.widget.selection_inner.appendChild(this.widget.selection_left);
    this.widget.selection_inner.appendChild(this.widget.selection_right);

    this.widget.overlay.setAttribute('state', '');
    this.widget.selection.setAttribute('state', '');
    this.widget.selection.style.top = this.widget.root.scrollTop + 'px';
    this.widget.selection.style.left = this.widget.root.scrollLeft + 'px';

    // Bind actions:
    bindEvent(this.widget.window, 'unload', actionClose);
    bindEvent(this.widget.window, 'keydown', actionKeyDown);
    bindEvent(this.widget.window, 'click', actionClick);
    bindEvent(this.widget.overlay, 'mousedown', actionAll);
    bindEvent(this.widget.selection, 'mousedown', actionMove);
    bindEvent(this.widget.selection, 'dblclick', actionSave);
    bindEvent(this.widget.selection_top, 'mousedown', actionTop);
    bindEvent(this.widget.selection_top_left, 'mousedown', actionTopLeft);
    bindEvent(this.widget.selection_top_right, 'mousedown', actionTopRight);
    bindEvent(this.widget.selection_bottom, 'mousedown', actionBottom);
    bindEvent(this.widget.selection_bottom_left, 'mousedown', actionBottomLeft);
    bindEvent(this.widget.selection_bottom_right, 'mousedown', actionBottomRight);
    bindEvent(this.widget.selection_left, 'mousedown', actionLeft);
    bindEvent(this.widget.selection_right, 'mousedown', actionRight);
};

applitools.SelectExplorer.prototype = {
    destroy: function () {
        this.close();
    }
};

