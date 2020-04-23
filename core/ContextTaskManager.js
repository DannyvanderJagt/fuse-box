"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
class ContextTaskManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.copyFilesTask = {};
        ctx.ict.on('complete', props => {
            this.perform();
            return props;
        });
        ctx.ict.on('rebundle', props => {
            this.perform();
            return props;
        });
    }
    copyFile(original, target) {
        this.copyFilesTask[original] = target;
    }
    async perform() {
        const promises = [];
        for (const original in this.copyFilesTask) {
            const target = this.copyFilesTask[original];
            this.ctx.log.verbose('copy', 'from $original to $target', { original, target });
            promises.push(utils_1.copyFile(original, target));
        }
        return Promise.all(promises)
            .then(() => this.flush())
            .catch(e => {
            this.ctx.log.error('Error while performing a task $error', { error: e.message });
            this.flush();
        });
    }
    flush() {
        this.copyFilesTask = {};
    }
}
exports.ContextTaskManager = ContextTaskManager;
function createContextTaskManager(ctx) {
    return new ContextTaskManager(ctx);
}
exports.createContextTaskManager = createContextTaskManager;
