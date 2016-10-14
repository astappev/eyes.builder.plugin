applitools.selectWidget = function (top_window, externalSaveAction) {
    if (top_window.document.defaultView.selectWidgetInstalled) {
        return;
    }

    var setting = {
        min_height: 4,
        min_width: 4,
        scroll_factor: 0.5
    };

    var widget = {
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

    var scrollToY = function (min_y, max_y) {
        var scroll_up = Math.round((24 - min_y + widget.root.scrollTop) * setting.scroll_factor);
        var scroll_down = Math.round((24 + max_y - widget.overlay.offsetHeight - widget.root.scrollTop) * setting.scroll_factor);

        if (scroll_up > 0) {
            widget.root.scrollTop -= scroll_up;
        } else if (scroll_down > 0) {
            widget.root.scrollTop += scroll_down;
        }
    };

    var scrollToX = function (min_x, max_x) {
        var scroll_left = Math.round((24 - min_x + widget.root.scrollLeft) * setting.scroll_factor);
        var scroll_down = Math.round((24 + max_x - widget.overlay.offsetWidth - widget.root.scrollLeft) * setting.scroll_factor);

        if (scroll_left > 0) {
            widget.root.scrollLeft -= scroll_left;
        } else if (scroll_down > 0) {
            widget.root.scrollLeft += scroll_down;
        }
    };

    var actionMove = function (event) {
        var stop = function () {
            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            var position = getPosition(widget.selection);
            var left = (event.pageX + offsetX);
            var top = (event.pageY + offsetY);
            var height = position.height;
            var width = position.width;

            if (left < 0) left = 0;
            if (top < 0) top = 0;

            if (left + width > widget.root.scrollWidth) {
                left = widget.root.scrollWidth - width;
            }

            if (top + height > widget.root.scrollHeight) {
                top = widget.root.scrollHeight - height;
            }

            scrollToY(top, top + height);
            scrollToX(left, left + width);

            widget.selection.style.left = left + 'px';
            widget.selection.style.top = top + 'px';
        };

        var position = getPosition(widget.selection);
        var offsetX = position.left - event.pageX;
        var offsetY = position.top - event.pageY;

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    var initSelectionTop = function (event) {
        var selection = getPosition(widget.selection);

        return {
            selection: selection,
            offset: selection.top - event.pageY,
            height: selection.height + selection.top
        };
    };

    var initSelectionBottom = function (event) {
        var selection = getPosition(widget.selection);

        return {
            selection: selection,
            offset: selection.height - event.pageY
        };
    };

    var initSelectionLeft = function (event) {
        var selection = getPosition(widget.selection);

        return {
            selection: selection,
            offset: selection.left - event.pageX,
            width: selection.width + selection.left
        };
    };

    var initSelectionRight = function (event) {
        var selection = getPosition(widget.selection);

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

        widget.selection.style.height = height + 'px';
        widget.selection.style.top = top + 'px';
    };

    var setSelectionBottom = function (event, context) {
        var height = (event.pageY + context.offset);

        if (height < setting.min_height) {
            height = setting.min_height;
        }

        if (context.selection.top + height > widget.root.scrollHeight) {
            height = widget.root.scrollHeight - context.selection.top;
        }

        scrollToY(event.pageY, event.pageY);

        widget.selection.style.height = height + 'px';
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

        widget.selection.style.width = width + 'px';
        widget.selection.style.left = left + 'px';
    };

    var setSelectionRight = function (event, context) {
        var width = (event.pageX + context.offset);

        if (width < setting.min_width) {
            width = setting.min_width;
        }

        if (context.selection.left + width > widget.root.scrollWidth) {
            width = widget.root.scrollWidth - context.selection.left;
        }

        scrollToX(event.pageX, event.pageX);

        widget.selection.style.width = width + 'px';
    };

    // Resize top:
    var actionTop = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-top');
            widget.selection.setAttribute('state', 'resize-top');

            setSelectionTop(event, context_top);
        };

        var context_top = initSelectionTop(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize top left:
    var actionTopLeft = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-top-left');
            widget.selection.setAttribute('state', 'resize-top-left');

            setSelectionTop(event, context_top);
            setSelectionLeft(event, context_left);
        };

        var context_top = initSelectionTop(event);
        var context_left = initSelectionLeft(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize top right:
    var actionTopRight = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-top-right');
            widget.selection.setAttribute('state', 'resize-top-right');

            setSelectionTop(event, context_top);
            setSelectionRight(event, context_right);
        };

        var context_top = initSelectionTop(event);
        var context_right = initSelectionRight(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize bottom:
    var actionBottom = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-bottom');
            widget.selection.setAttribute('state', 'resize-bottom');

            setSelectionBottom(event, context_bottom);
        };

        var context_bottom = initSelectionBottom(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize bottom left:
    var actionBottomLeft = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-bottom-left');
            widget.selection.setAttribute('state', 'resize-bottom-left');

            setSelectionBottom(event, context_bottom);
            setSelectionLeft(event, context_left);
        };

        var context_bottom = initSelectionBottom(event);
        var context_left = initSelectionLeft(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize bottom right:
    var actionBottomRight = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-bottom-right');
            widget.selection.setAttribute('state', 'resize-bottom-right');

            setSelectionBottom(event, context_bottom);
            setSelectionRight(event, context_right);
        };

        var context_bottom = initSelectionBottom(event);
        var context_right = initSelectionRight(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize left:
    var actionLeft = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-left');
            widget.selection.setAttribute('state', 'resize-left');

            setSelectionLeft(event, context_left);
        };

        var context_left = initSelectionLeft(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Resize right:
    var actionRight = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'resize-right');
            widget.selection.setAttribute('state', 'resize-right');

            setSelectionRight(event, context_right);
        };

        var context_right = initSelectionRight(event);

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    // Select:
    var actionAll = function (event) {
        var stop = function () {
            widget.overlay.setAttribute('state', '');
            widget.selection.setAttribute('state', '');

            unbindEvent(widget.selection, 'mousemove', move);
            unbindEvent(widget.selection, 'mouseup', stop);
            unbindEvent(widget.overlay, 'mousemove', move);
            unbindEvent(widget.overlay, 'mouseup', stop);
            unbindEvent(widget.document, 'mouseleave', stop);
        };

        var move = function (event) {
            widget.overlay.setAttribute('state', 'selecting');
            widget.selection.setAttribute('state', 'selecting');

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

            widget.selection.style.top = top + 'px';
            widget.selection.style.left = left + 'px';
            widget.selection.style.width = width + 'px';
            widget.selection.style.height = height + 'px';
        };

        var start = {
            x: event.pageX,
            y: event.pageY
        };

        bindEvent(widget.selection, 'mousemove', move);
        bindEvent(widget.selection, 'mouseup', stop);
        bindEvent(widget.overlay, 'mousemove', move);
        bindEvent(widget.overlay, 'mouseup', stop);
        bindEvent(widget.document, 'mouseleave', stop);
        stopPropagation(event);
    };

    var actionKeyDown = function (event) {
        if (event.keyCode == 27) actionClose();
        else if (event.keyCode == 13) externalSaveAction();
        else return;

        unbindEvent(widget.window, 'keydown', actionKeyDown);
    };

    var actionClose = function () {
        widget.window.selectWidgetInstalled = false;
        unbindEvent(widget.window, 'unload', actionClose);
        unbindEvent(widget.window, 'keydown', actionKeyDown);
        unbindEvent(widget.overlay, 'mousedown', actionAll);
        unbindEvent(widget.selection, 'mousedown', actionMove);
        unbindEvent(widget.selection, 'dblclick', externalSaveAction);

        widget.root.removeChild(styles);
        widget.root.removeChild(widget.overlay);
        widget.root.removeChild(widget.selection);
    };

    // Define widgets:
    widget.document = top_window.document;
    widget.window = widget.document.defaultView;
    widget.window.selectWidgetInstalled = true;

    widget.root = widget.document.documentElement;
    widget.overlay = widget.document.createElement('selectWidget-overlay');
    widget.selection = widget.document.createElement('selectWidget-selection');
    widget.selection_inner = widget.document.createElement('selectWidget-selection-inner');
    widget.selection_top = widget.document.createElement('selectWidget-selection-top');
    widget.selection_top_left = widget.document.createElement('selectWidget-selection-top-left');
    widget.selection_top_right = widget.document.createElement('selectWidget-selection-top-right');
    widget.selection_bottom = widget.document.createElement('selectWidget-selection-bottom');
    widget.selection_bottom_left = widget.document.createElement('selectWidget-selection-bottom-left');
    widget.selection_bottom_right = widget.document.createElement('selectWidget-selection-bottom-right');
    widget.selection_left = widget.document.createElement('selectWidget-selection-left');
    widget.selection_right = widget.document.createElement('selectWidget-selection-right');

    var styles = widget.document.createElement('style');
    styles.type = 'text/css';
    var path = builder.plugins.getResourcePath('applitools', 'widgetStyles.css');
    interface.loadStylesFromFile(path, styles);

    widget.root.appendChild(styles);
    widget.root.appendChild(widget.overlay);
    widget.root.appendChild(widget.selection);
    widget.selection.appendChild(widget.selection_inner);
    widget.selection_inner.appendChild(widget.selection_top);
    widget.selection_inner.appendChild(widget.selection_top_left);
    widget.selection_inner.appendChild(widget.selection_top_right);
    widget.selection_inner.appendChild(widget.selection_bottom);
    widget.selection_inner.appendChild(widget.selection_bottom_left);
    widget.selection_inner.appendChild(widget.selection_bottom_right);
    widget.selection_inner.appendChild(widget.selection_left);
    widget.selection_inner.appendChild(widget.selection_right);

    widget.overlay.setAttribute('state', '');
    widget.selection.setAttribute('state', '');
    widget.selection.style.top = widget.root.scrollTop + 'px';
    widget.selection.style.left = widget.root.scrollLeft + 'px';

    // Bind actions:
    bindEvent(widget.window, 'unload', actionClose);
    bindEvent(widget.window, 'keydown', actionKeyDown);
    bindEvent(widget.overlay, 'mousedown', actionAll);
    bindEvent(widget.selection, 'mousedown', actionMove);
    bindEvent(widget.selection, 'dblclick', externalSaveAction);
    bindEvent(widget.selection_top, 'mousedown', actionTop);
    bindEvent(widget.selection_top_left, 'mousedown', actionTopLeft);
    bindEvent(widget.selection_top_right, 'mousedown', actionTopRight);
    bindEvent(widget.selection_bottom, 'mousedown', actionBottom);
    bindEvent(widget.selection_bottom_left, 'mousedown', actionBottomLeft);
    bindEvent(widget.selection_bottom_right, 'mousedown', actionBottomRight);
    bindEvent(widget.selection_left, 'mousedown', actionLeft);
    bindEvent(widget.selection_right, 'mousedown', actionRight);

    this.getRegion = function () {
        return getPosition(widget.selection);
    };

    this.close = function () {
        actionClose();
    };

    return this;
};
