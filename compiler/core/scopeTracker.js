"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../interfaces/AST");
const _FunctionDecl = {
    ArrowFunctionExpression: 1,
    ClassDeclaration: 1,
    FunctionDeclaration: 1,
    FunctionExpression: 1,
    [AST_1.ASTType.CatchClause]: 1,
    [AST_1.ASTType.EnumDeclaration]: 1,
};
// const _Body = {
//   [ASTType.BlockStatement]: 1,
//   [ASTType.Program]: 1,
// };
function extractDefinedVariables(schema, node, names) {
    if (node.type === AST_1.ASTType.Identifier) {
        names[node.name] = { node, schema };
        return;
    }
    if (node.type === AST_1.ASTType.ObjectPattern) {
        for (const property of node.properties) {
            let target = property;
            if (property.type === AST_1.ASTType.Property)
                target = property.value;
            extractDefinedVariables(schema, target, names);
        }
    }
    if (node.type === AST_1.ASTType.ArrayPattern) {
        for (const element of node.elements) {
            if (element)
                extractDefinedVariables(schema, element, names);
        }
    }
    if (node.type === AST_1.ASTType.RestElement) {
        return extractDefinedVariables(schema, node.argument, names);
    }
}
exports.extractDefinedVariables = extractDefinedVariables;
function extractDeclarations(schema, node, bodyScope) {
    if (!node.declarations)
        return;
    for (const decl of node.declarations) {
        if (decl.type === AST_1.ASTType.VariableDeclarator && decl.id)
            extractDefinedVariables(schema, decl.id, bodyScope);
    }
}
function scopeTracker(schema) {
    const { node, parent } = schema;
    if (node.body) {
        let body = node.body;
        const bodyScope = {};
        const bodyNodesLength = body.length;
        let index = 0;
        if (parent) {
            if (parent.param && parent.param.type === AST_1.ASTType.Identifier) {
                // catch clause
                bodyScope[parent.param.name] = { node: parent.param, schema };
            }
            // function arguments
            if (parent.params) {
                for (const param of parent.params) {
                    if (param.type === AST_1.ASTType.Identifier)
                        bodyScope[param.name] = { node: param, schema };
                    if (param.type === AST_1.ASTType.ParameterProperty &&
                        param.parameter &&
                        param.parameter.type === AST_1.ASTType.Identifier) {
                        bodyScope[param.parameter.name] = { node: param, schema };
                    }
                }
            }
        }
        // for loops
        // for (var i = 0; i <= 0; i++) {}
        // should set the body scope
        if (node.type === AST_1.ASTType.ForStatement && node.init && node.init.type === AST_1.ASTType.VariableDeclaration) {
            extractDeclarations(schema, node.init, bodyScope);
        }
        while (index < bodyNodesLength) {
            const item = body[index];
            const type = item.type;
            if (type === AST_1.ASTType.ImportDeclaration && item.specifiers) {
                for (const specifier of item.specifiers) {
                    bodyScope[specifier.local.name] = { node: specifier, schema };
                }
            }
            // Variable declarations
            // const foo = 1
            if (type === AST_1.ASTType.VariableDeclaration) {
                // here we just update the existing scope
                extractDeclarations(schema, item, bodyScope);
            }
            // function and class declarations
            if (_FunctionDecl[type]) {
                // Catch the following
                // function foo(){}
                // class Foo {}
                if (item.id && item.id.name)
                    bodyScope[item.id.name] = { node: item, schema };
            }
            index++;
        }
        return bodyScope;
    }
}
exports.scopeTracker = scopeTracker;
