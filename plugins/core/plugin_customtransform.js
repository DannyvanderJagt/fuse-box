"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function pluginCustomTransform(customTransformers) {
    return (ctx) => {
        ctx.customTransformers = customTransformers;
    };
}
exports.pluginCustomTransform = pluginCustomTransform;
