"use strict";
// Configuration types
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_APP_STATE = exports.DEFAULT_APP_SETTINGS = exports.AuthMethod = void 0;
var AuthMethod;
(function (AuthMethod) {
    AuthMethod["PAT"] = "pat";
    AuthMethod["SSH"] = "ssh";
})(AuthMethod || (exports.AuthMethod = AuthMethod = {}));
// Default values
exports.DEFAULT_APP_SETTINGS = {
    autoSaveEnabled: false,
    autoSaveIntervalSec: 30,
    theme: 'system',
    editorPrefs: {
        fontSize: 14,
        lineNumbers: true,
        wordWrap: true,
        tabSize: 2,
        showPreview: true,
    },
};
exports.DEFAULT_APP_STATE = {
    expandedFolders: [],
};
