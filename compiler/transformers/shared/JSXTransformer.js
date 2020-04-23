"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../../interfaces/AST");
//const Factories: { [key: string]: () => ASTNode } = {};
function createJSXFactory(props) {
    if (!props.second) {
        return (args) => {
            return {
                arguments: args,
                callee: {
                    name: props.first,
                    type: 'Identifier',
                },
                type: 'CallExpression',
            };
        };
    }
    return (args) => {
        return {
            arguments: args,
            callee: {
                computed: false,
                object: {
                    name: props.first,
                    type: 'Identifier',
                },
                property: {
                    name: props.second,
                    type: 'Identifier',
                },
                type: 'MemberExpression',
            },
            type: 'CallExpression',
        };
    };
}
function createObjectAssignExpression() {
    return {
        arguments: [],
        callee: {
            computed: false,
            object: {
                name: 'Object',
                type: 'Identifier',
            },
            property: {
                name: 'assign',
                type: 'Identifier',
            },
            type: 'MemberExpression',
        },
        type: 'CallExpression',
    };
}
function parseFactory(factory) {
    const [first, second] = factory.split('.');
    const JSXFragment = {
        computed: false,
        object: {
            name: first,
            type: 'Identifier',
        },
        property: {
            name: 'Fragment',
            type: 'Identifier',
        },
        type: 'MemberExpression',
    };
    const createElement = createJSXFactory({ first, second });
    return { JSXFragment, createElement };
}
function convertJSXMemberExpression(expression) {
    if (expression.type === AST_1.ASTType.JSXMemberExpression)
        expression.type = 'MemberExpression';
    if (expression.type === AST_1.ASTType.JSXIdentifier)
        expression.type = 'Identifier';
    if (expression.property && expression.property.type === AST_1.ASTType.JSXIdentifier)
        expression.property.type = 'Identifier';
    if (expression.object) {
        if (expression.object.type === AST_1.ASTType.JSXMemberExpression) {
            return convertJSXMemberExpression(expression.object);
        }
        if (expression.object.type === AST_1.ASTType.JSXIdentifier)
            expression.object.type = 'Identifier';
    }
}
function JSXTransformer() {
    return {
        commonVisitors: props => {
            const { transformationContext: { compilerOptions: { jsxFactory }, module: { extension }, }, } = props;
            // we don't need this for normal TypeScript files
            if (extension === '.ts')
                return;
            // prepare for setting up the jsxFactory
            let initJsxFactory = false;
            let JSXFragment;
            let createElement;
            return {
                onEach: (schema) => {
                    const { context, node, replace } = schema;
                    const name = node.name;
                    // We only want to setup the jsxFacory once for this module
                    if (!initJsxFactory) {
                        const factory = context.jsxFactory;
                        ({ JSXFragment, createElement } = parseFactory(factory || jsxFactory));
                        initJsxFactory = true;
                    }
                    switch (node.type) {
                        case 'JSXElement':
                            let props;
                            let propObjects = [];
                            let propObject;
                            let newObj = true;
                            let spreaded = false;
                            const { openingElement } = node;
                            for (const attr of openingElement.attributes) {
                                // less member access
                                let { type, value } = attr; // call 'attr' once
                                if (type === 'JSXAttribute') {
                                    if (!value) {
                                        value = { type: 'Literal', value: true };
                                    }
                                    let key;
                                    if (attr.name.name.indexOf('-') > -1) {
                                        key = { type: 'Literal', value: attr.name.name };
                                    }
                                    else {
                                        key = { name: attr.name.name, type: 'Identifier' };
                                    }
                                    const createdProp = {
                                        computed: false,
                                        key: key,
                                        kind: 'init',
                                        method: false,
                                        shorthand: false,
                                        type: 'Property',
                                        value: value,
                                    };
                                    if (newObj) {
                                        propObject = {
                                            properties: [createdProp],
                                            type: 'ObjectExpression',
                                        };
                                        newObj = false;
                                    }
                                    else {
                                        propObject.properties.push(createdProp);
                                    }
                                }
                                if (type === 'JSXSpreadAttribute') {
                                    spreaded = true;
                                    if (propObject) {
                                        propObjects.push(propObject);
                                        // reset for attributes after spread operator
                                        propObject = undefined;
                                    }
                                    else {
                                        propObjects.push({
                                            properties: [],
                                            type: 'ObjectExpression',
                                        });
                                    }
                                    newObj = true;
                                    propObjects.push(attr.argument);
                                }
                            }
                            if (spreaded) {
                                props = createObjectAssignExpression();
                                if (propObject) {
                                    propObjects.push(propObject);
                                }
                                props.arguments = propObjects;
                            }
                            else if (propObject) {
                                props = propObject;
                            }
                            else
                                props = { type: 'Literal', value: null };
                            return replace(createElement([openingElement.name, props].concat(node.children)));
                        case 'JSXExpressionContainer':
                        case 'JSXSpreadChild':
                            if (node.expression.type === 'JSXEmptyExpression')
                                return schema.remove();
                            return replace(node.expression);
                        case 'JSXFragment':
                            return replace(createElement([JSXFragment, { type: 'Literal', value: null }].concat(node.children)));
                        case 'JSXIdentifier':
                            if (name[0] === name[0].toLowerCase()) {
                                return replace({ type: 'Literal', value: name });
                            }
                            node.type = 'Identifier';
                            return replace(node);
                        case 'JSXMemberExpression':
                            convertJSXMemberExpression(node);
                            return replace(node);
                        case 'JSXText':
                            if (node.value.indexOf('\n') > -1 && !node.value.trim()) {
                                return schema.remove();
                            }
                            return replace({ type: 'Literal', value: node.value });
                    }
                },
            };
        },
    };
}
exports.JSXTransformer = JSXTransformer;
