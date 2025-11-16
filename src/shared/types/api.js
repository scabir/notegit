"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrorCode = void 0;
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["GIT_NOT_INSTALLED"] = "GIT_NOT_INSTALLED";
    ApiErrorCode["GIT_CLONE_FAILED"] = "GIT_CLONE_FAILED";
    ApiErrorCode["GIT_AUTH_FAILED"] = "GIT_AUTH_FAILED";
    ApiErrorCode["GIT_PULL_FAILED"] = "GIT_PULL_FAILED";
    ApiErrorCode["GIT_PUSH_FAILED"] = "GIT_PUSH_FAILED";
    ApiErrorCode["GIT_CONFLICT"] = "GIT_CONFLICT";
    ApiErrorCode["FS_NOT_FOUND"] = "FS_NOT_FOUND";
    ApiErrorCode["FS_PERMISSION_DENIED"] = "FS_PERMISSION_DENIED";
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
