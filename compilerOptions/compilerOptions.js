"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const bundleRuntimeCore_1 = require("../bundleRuntime/bundleRuntimeCore");
const env_1 = require("../env");
const utils_1 = require("../utils/utils");
const findTSConfig_1 = require("./findTSConfig");
const parseTypescriptConfig_1 = require("./parseTypescriptConfig");
function createCompilerOptions(ctx) {
    let options = ctx.config.compilerOptions || {};
    if (!options.jsxFactory)
        options.jsxFactory = 'React.createElement';
    if (options.esModuleInterop === undefined)
        options.esModuleInterop = true;
    if (options.esModuleStatement === undefined)
        options.esModuleStatement = true;
    options.processEnv = ctx.config.env;
    options.buildTarget = ctx.config.target;
    if (!options.jsParser)
        options.jsParser = {};
    if (!options.jsParser.nodeModules)
        options.jsParser.nodeModules = 'meriyah';
    if (!options.jsParser.project)
        options.jsParser.project = 'ts';
    let tsConfigPath;
    // setting up a path to the user specific tsconfig.json
    if (options.tsConfig) {
        if (typeof options.tsConfig !== 'string') {
            throw new Error('tsConfig accepts a path only');
        }
        tsConfigPath = utils_1.ensureAbsolutePath(options.tsConfig, env_1.env.SCRIPT_PATH);
    }
    else {
        const fileName = ctx.config.entries[0];
        tsConfigPath = findTSConfig_1.findTsConfig({ fileName: fileName, root: env_1.env.APP_ROOT });
    }
    let baseURL = options.baseUrl;
    let tsConfigDirectory;
    if (tsConfigPath) {
        const data = parseTypescriptConfig_1.parseTypescriptConfig(tsConfigPath);
        tsConfigDirectory = path.dirname(tsConfigPath);
        const tsConfig = data.config;
        if (data.error) {
            let message = 'Error while initializing tsconfig';
            ctx.fatal('tsconfig error', [data.error.messageText || message]);
        }
        if (tsConfig) {
            let tsConfigCompilerOptions = {};
            if (tsConfig.compilerOptions) {
                tsConfigCompilerOptions = tsConfig.compilerOptions;
                if (tsConfigCompilerOptions.baseUrl) {
                    baseURL = tsConfigCompilerOptions.baseUrl;
                }
            }
            if (tsConfig.extends) {
                const targetExtendedFile = path.join(tsConfigDirectory, tsConfig.extends);
                const extendedData = parseTypescriptConfig_1.parseTypescriptConfig(targetExtendedFile);
                if (extendedData.error) {
                    let message = 'Error while initializing tsconfig';
                    ctx.fatal('tsconfig extends error', [data.error.messageText || message]);
                }
                if (extendedData.config) {
                    if (extendedData.config.compilerOptions) {
                        if (extendedData.config.compilerOptions.baseUrl && !baseURL) {
                            tsConfigDirectory = path.dirname(targetExtendedFile);
                            baseURL = extendedData.config.compilerOptions.baseUrl;
                        }
                        for (const key in extendedData.config.compilerOptions) {
                            tsConfigCompilerOptions[key] = extendedData.config.compilerOptions[key];
                        }
                    }
                }
            }
            if (tsConfig.compilerOptions) {
                const tsConfigCompilerOptions = tsConfig.compilerOptions;
                if (tsConfigCompilerOptions.paths)
                    options.paths = tsConfigCompilerOptions.paths;
                // to keep it compatible with the old versions
                if (tsConfigCompilerOptions.allowSyntheticDefaultImports)
                    options.esModuleInterop = true;
                // esModuleInterop has more weight over allowSyntheticDefaultImports
                if (tsConfigCompilerOptions.esModuleInterop !== undefined)
                    options.esModuleInterop = tsConfigCompilerOptions.esModuleInterop;
                if (tsConfigCompilerOptions.experimentalDecorators !== undefined)
                    options.experimentalDecorators = tsConfigCompilerOptions.experimentalDecorators;
                if (tsConfigCompilerOptions.emitDecoratorMetadata !== undefined)
                    options.emitDecoratorMetadata = tsConfigCompilerOptions.emitDecoratorMetadata;
                if (tsConfigCompilerOptions.jsxFactory)
                    options.jsxFactory = tsConfigCompilerOptions.jsxFactory;
            }
            options.tsReferences = tsConfig.references;
        }
    }
    if (baseURL)
        options.baseUrl = path.resolve(tsConfigDirectory, baseURL);
    if (options.buildEnv === undefined) {
        options.buildEnv = {};
    }
    if (!options.transformers)
        options.transformers = [];
    // set default helplers
    options.buildEnv.require = bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.GLOBAL_OBJ + '.' + bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.REQUIRE_FUNCTION;
    options.buildEnv.cachedModules = bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.GLOBAL_OBJ + '.' + bundleRuntimeCore_1.BUNDLE_RUNTIME_NAMES.CACHE_MODULES;
    return options;
}
exports.createCompilerOptions = createCompilerOptions;