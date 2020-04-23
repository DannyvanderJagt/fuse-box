"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sourceMapModule = require("source-map");
const ts = require("typescript");
const generator_1 = require("../compiler/generator/generator");
const parser_1 = require("../compiler/parser");
const extensions_1 = require("../config/extensions");
const env_1 = require("../env");
const utils_1 = require("../utils/utils");
const package_1 = require("./package");
function Module() { }
exports.Module = Module;
function createModule(props) {
    const self = {
        ctx: props.ctx,
        dependencies: [],
        pkg: props.pkg,
        // legacy props
        props: {},
        storage: {},
        // generate the code
        generate: () => {
            if (!self.ast)
                throw new Error('Cannot generate code without AST');
            const genOptions = {
                ecmaVersion: 7,
            };
            if (self.isSourceMapRequired) {
                const sourceMap = new sourceMapModule.SourceMapGenerator({
                    file: self.publicPath,
                });
                genOptions.sourceMap = sourceMap;
            }
            if (self.ctx.config.isProduction) {
                genOptions.indent = '';
                genOptions.lineEnd = '';
            }
            const code = generator_1.generate(self.ast, genOptions);
            if (self.isSourceMapRequired) {
                const jsonSourceMaps = genOptions.sourceMap.toJSON();
                if (!jsonSourceMaps.sourcesContent) {
                    delete jsonSourceMaps.file;
                    jsonSourceMaps.sources = [self.publicPath];
                    jsonSourceMaps.sourcesContent = [self.contents];
                }
                self.sourceMap = JSON.stringify(jsonSourceMaps);
            }
            self.contents = code;
            return code;
        },
        getMeta: () => {
            const meta = {
                absPath: self.absPath,
                dependencies: self.dependencies,
                id: self.id,
                mtime: utils_1.getFileModificationTime(self.absPath),
                packageId: props.pkg !== undefined ? props.pkg.publicName : undefined,
                publicPath: self.publicPath,
            };
            if (self.breakDependantsCache)
                meta.breakDependantsCache = true;
            return meta;
        },
        getTransformationContext: () => {
            return {
                compilerOptions: self.ctx.compilerOptions,
                config: {
                    electron: {
                        nodeIntegration: self.ctx.config.electron.nodeIntegration,
                    },
                },
                module: {
                    absPath: self.absPath,
                    extension: self.extension,
                    isSourceMapRequired: self.isSourceMapRequired,
                    publicPath: self.publicPath,
                },
                pkg: { type: self.pkg.type },
            };
        },
        init: () => {
            const ext = path.extname(props.absPath);
            self.extension = path.extname(props.absPath);
            self.isJavaScript = extensions_1.JS_EXTENSIONS.includes(ext);
            self.isTypeScript = extensions_1.TS_EXTENSIONS.includes(ext);
            self.isStylesheet = extensions_1.STYLESHEET_EXTENSIONS.includes(ext);
            self.isExecutable = extensions_1.EXECUTABLE_EXTENSIONS.includes(ext);
            self.absPath = props.absPath;
            self.isCommonsEligible = false;
            self.pending = [];
            self.moduleSourceRefs = {};
            self.isEntry = false;
            self.isSplit = false;
            const config = props.ctx.config;
            if (self.isStylesheet) {
                let isCSSSourceMapRequired = true;
                if (config.sourceMap.css === false) {
                    isCSSSourceMapRequired = false;
                }
                if (props.pkg && props.pkg.type === package_1.PackageType.EXTERNAL_PACKAGE && !config.sourceMap.vendor) {
                    isCSSSourceMapRequired = false;
                }
                self.isCSSSourceMapRequired = isCSSSourceMapRequired;
            }
            self.props.fuseBoxPath = utils_1.makePublicPath(self.absPath);
            self.publicPath = self.props.fuseBoxPath;
            self.isSourceMapRequired = true;
            if (self.pkg && self.pkg.type === package_1.PackageType.USER_PACKAGE) {
                if (!config.sourceMap.project)
                    self.isSourceMapRequired = false;
            }
            else {
                if (!config.sourceMap.vendor)
                    self.isSourceMapRequired = false;
            }
        },
        initFromCache: (meta, data) => {
            self.id = meta.id;
            self.absPath = meta.absPath;
            self.extension = path.extname(self.absPath);
            self.isJavaScript = extensions_1.JS_EXTENSIONS.includes(self.extension);
            self.isTypeScript = extensions_1.TS_EXTENSIONS.includes(self.extension);
            self.isStylesheet = extensions_1.STYLESHEET_EXTENSIONS.includes(self.extension);
            self.isExecutable = extensions_1.EXECUTABLE_EXTENSIONS.includes(self.extension);
            self.contents = data.contents;
            self.sourceMap = data.sourceMap;
            self.dependencies = meta.dependencies;
            self.publicPath = meta.publicPath;
            self.breakDependantsCache = meta.breakDependantsCache;
            self.isCached = true;
            if (self.sourceMap)
                self.isSourceMapRequired = true;
        },
        // parse using javascript or typescript
        parse: () => {
            if (!self.contents) {
                props.ctx.log.warn(`One of your dependencies contains an empty module:\n\t ${self.publicPath}`);
                self.ast = {
                    body: [
                        {
                            declaration: {
                                type: 'Literal',
                                value: '',
                            },
                            type: 'ExportDefaultDeclaration',
                        },
                    ],
                    sourceType: 'module',
                    type: 'Program',
                };
                return self.ast;
            }
            let parser;
            if (self.isTypeScript)
                parser = parser_1.parseTypeScript;
            else {
                parser = parser_1.parseJavascript;
                const parserOptions = self.ctx.compilerOptions.jsParser;
                const isExternal = self.pkg.type === package_1.PackageType.EXTERNAL_PACKAGE;
                if (isExternal) {
                    if (parserOptions.nodeModules === 'ts')
                        parser = parser_1.parseTypeScript;
                }
                else if (parserOptions.project === 'ts')
                    parser = parser_1.parseTypeScript;
            }
            const jsxRequired = self.extension !== '.ts';
            try {
                // @todo: fix jsx properly
                self.ast = parser(self.contents, {
                    jsx: jsxRequired,
                    locations: self.isSourceMapRequired,
                });
                self.errored = false;
            }
            catch (e) {
                self.errored = true;
                const message = `Error while parsing module ${self.absPath}\n\t ${e.stack || e.message}`;
                props.ctx.log.error(message);
                self.ast = parser_1.parseJavascript(``);
            }
            return self.ast;
        },
        // read the contents
        read: () => {
            if (self.contents !== undefined)
                return self.contents;
            try {
                self.contents = utils_1.readFile(self.absPath);
            }
            catch (e) {
                if (self.absPath.includes('node_modules')) {
                    props.ctx.log.warn(`Did you forget to run 'npm install'?`);
                }
                props.ctx.log.error(`Module not found at\n\t${self.publicPath}`, e.message);
                throw e;
            }
            return self.contents;
        },
        transpileDown: (buildTarget) => {
            // we can't support sourcemaps on downtranspiling
            self.isSourceMapRequired = false;
            const config = ts.convertCompilerOptionsFromJson({ importHelpers: false, noEmitHelpers: true, target: buildTarget }, env_1.env.SCRIPT_PATH);
            const data = ts.transpileModule(self.contents, {
                compilerOptions: config.options,
                fileName: self.absPath,
            });
            self.contents = data.outputText;
        },
    };
    return self;
}
exports.createModule = createModule;
