// tests/helpers/mock-vscode.js
'use strict';

var Module = require('module');
var path = require('path');

var mockVscode = {
    Uri: {
        joinPath: function(base) {
            var parts = Array.prototype.slice.call(arguments, 1);
            var result = (base && base.fsPath) ? base.fsPath : String(base);
            parts.forEach(function(p) { result = path.join(result, p); });
            return { fsPath: result, path: result, toString: function() { return 'file:///' + result.replace(/\\/g, '/'); } };
        },
        parse: function(s) { return { toString: function() { return s; } }; }
    },
    commands: {
        registerCommand: function() { return { dispose: function() {} }; }
    },
    window: {
        createWebviewPanel: function() { return {}; },
        showErrorMessage: function() {}
    },
    ViewColumn: { Active: 1 },
    env: { openExternal: function() {} }
};

var originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
    if (request === 'vscode') return mockVscode;
    return originalLoad.apply(this, arguments);
};

module.exports = mockVscode;
