// Basic JavaScript HTML5 GUI Helper Functions
// Author: David Churchill, Memorial University
//         dave.churchill@gmail.com

GUI = function(container) {

    var self = {};
    self.container = container;

    self.create = function(type, id, left, top, width, height) {
        var elem = document.createElement(type);
        elem.id = id;
        elem.style.position = 'absolute';
        if (left != 0) {
            elem.style.left = left;
        }
        if (top != 0) {
            elem.style.top = top;
        }
        if (height != 0) {
            if (type === 'canvas') {
                elem.height = height;
            } else {
                elem.style.height = height;
            }
        }
        if (width != 0) {
            if (type === 'canvas') {
                elem.width = width;
            } else {
                elem.style.width = width;
            }
        }
        self.container.appendChild(elem);
        return elem;
    }

    self.createCanvas = function(width, height) {
        self.bg = self.create('canvas', 'bg', 0, 0, width, height);
        self.fg = self.create('canvas', 'fg', 0, 0, width, height);
        self.bg_ctx = self.bg.getContext("2d");
        self.fg_ctx = self.fg.getContext("2d");
        self.fg_ctx.font = '14px Arial';
    }

    self.getMousePos = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    return self;
}