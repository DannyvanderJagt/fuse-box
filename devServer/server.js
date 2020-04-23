"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const bundle_1 = require("../bundle/bundle");
const exit_1 = require("../utils/exit");
function getAbsPath(ctx, bundles) {
    let entry;
    let resolved = false;
    for (const bundle of bundles) {
        if (bundle.bundle.type === bundle_1.BundleType.JS_SERVER_ENTRY) {
            resolved = true;
            entry = bundle.absPath;
            break;
        }
        else {
            if (bundle.bundle.type === bundle_1.BundleType.JS_APP) {
                resolved = true;
                entry = bundle.absPath;
            }
        }
    }
    if (!resolved) {
        ctx.fatal('server', ['Failed to resolve server entry']);
    }
    return entry;
}
exports.createServerProcess = (props) => {
    const { bundles, ctx, processName } = props;
    let server;
    if (ctx.serverProcess)
        return ctx.serverProcess;
    let entry = getAbsPath(ctx, bundles);
    const self = {
        start: (props) => {
            props = props || {};
            const userOptions = props.options || {};
            ctx.log.info('server', `spawn ${entry}`);
            const argsBefore = props.argsBefore || [];
            const argsAfter = props.argsAfter || [];
            server = child_process_1.spawn(props.processName || processName, [...argsBefore, entry, ...argsAfter], Object.assign({ env: Object.assign(Object.assign({}, process.env), ctx.config.env), stdio: 'inherit' }, userOptions));
            server.on('close', code => {
                if (code === 8) {
                    console.error('Error detected, waiting for changes...');
                }
            });
            return server;
        },
        stop: () => {
            if (server) {
                server.kill('SIGINT');
                ctx.log.info('server', `Killed ${entry}`);
            }
        },
    };
    exit_1.onExit('ServerProcess', () => {
        self.stop();
    });
    ctx.ict.on('rebundle', props => {
        entry = getAbsPath(ctx, props.bundles);
        self.stop();
        self.start();
    });
    ctx.serverProcess = self;
    return self;
};