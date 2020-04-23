"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sourceMapsURL(file) {
    return `//# sourceMappingURL=${file}`;
}
exports.sourceMapsURL = sourceMapsURL;
function sourceMapsCSSURL(file) {
    return `/*# sourceMappingURL=${file} */`;
}
exports.sourceMapsCSSURL = sourceMapsCSSURL;
