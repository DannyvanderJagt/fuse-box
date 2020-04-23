"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils/utils");
const bundleRuntimeCore_1 = require("./bundleRuntimeCore");
const FuseName = bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.GLOBAL_OBJ;
const BundleFN = FuseName + '.' + bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.BUNDLE_FUNCTION;
const ReqFn = FuseName + '.' + bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.REQUIRE_FUNCTION;
function createBundleSource(props) {
    function generateCSS(self, opts) {
        const concat = new utils_1.Concat(true, '', '\n');
        const totalAmount = self.modules.length;
        let index = 0;
        while (index < totalAmount) {
            const module = self.modules[index];
            const cssData = module.css;
            if (cssData) {
                const cssString = cssData.css.replace(/\/\*\#\s?sourceMappingURL.*?\*\//g, '');
                concat.add(module.publicPath, cssString, module.isSourceMapRequired ? cssData.map : undefined);
                if (module.isSourceMapRequired && cssData.map) {
                    self.containsMaps = true;
                }
            }
            index++;
        }
        return concat;
    }
    const self = {
        containsMaps: false,
        entries: [],
        injection: [],
        // user injection
        // for example inject some code after the bundle is ready
        modules: [],
        generate: (opts) => {
            if (props.isCSS)
                return generateCSS(self, opts);
            const concat = new utils_1.Concat(true, '', '\n');
            // start the wrapper for the entire bundle if required
            if (opts.isIsolated)
                concat.add(null, `(function(){`);
            // adding core api if required
            if (opts.runtimeCore)
                concat.add(null, opts.runtimeCore);
            concat.add(null, BundleFN + '({');
            let index = 0;
            const totalAmount = self.modules.length;
            while (index < totalAmount) {
                const module = self.modules[index];
                const isLast = index + 1 === totalAmount;
                if (!props.isProduction)
                    concat.add(null, `\n// ${module.publicPath} @${module.id}`);
                concat.add(null, module.id + `: function(${bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.ARG_REQUIRE_FUNCTION}, exports, module){`);
                if (module.isSourceMapRequired && module.sourceMap) {
                    self.containsMaps = true;
                }
                if (module.contents) {
                    concat.add(null, module.contents, module.isSourceMapRequired ? module.sourceMap : undefined);
                }
                concat.add(null, '}' + (isLast ? '' : ','));
                index++;
            }
            let injectionCode = [];
            // add entries
            // e.g __fuse.r(1)
            if (self.entries) {
                for (const entry of self.entries) {
                    injectionCode.push(ReqFn + '(' + entry.id + ')');
                }
            }
            // add exposed variables
            // for example on nodejs that will be "exports" on browser "window"
            if (self.exported) {
                let exposedGlobal;
                if (props.target === 'browser' || props.target === 'electron')
                    exposedGlobal = 'window';
                else if (props.target === 'server')
                    exposedGlobal = 'exports';
                // we cannot expose on web-worker target
                if (exposedGlobal) {
                    let exposeCode = '';
                    for (const mod of self.entries) {
                        exposeCode += `var obj = ${ReqFn + '(' + mod.id + ')'};\n`;
                        exposeCode += `for(var key in obj) { if (obj.hasOwnProperty(key) ) {${exposedGlobal}[key] = obj[key]} }`;
                    }
                    injectionCode.push(exposeCode);
                }
            }
            if (self.injection.length) {
                for (const userInjectionLine of self.injection)
                    injectionCode.push(userInjectionLine);
            }
            let readyFunction = '';
            if (injectionCode.length)
                readyFunction = `, function(){\n` + injectionCode.join('\n') + '\n}';
            concat.add(null, '}' + readyFunction + ')');
            // end the isolation
            if (opts.isIsolated)
                concat.add(null, `})()`);
            return concat;
        },
        generateHash: () => {
            let str = '';
            for (const module of self.modules) {
                str += utils_1.getFileModificationTime(module.absPath).toString();
            }
            return utils_1.fastHash(str);
        },
    };
    return self;
}
exports.createBundleSource = createBundleSource;
