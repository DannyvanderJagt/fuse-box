"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function finalizeFusebox(ctx) {
    const log = ctx.log;
    log.stopStreaming();
    log.fuseFinalise();
}
exports.finalizeFusebox = finalizeFusebox;
