"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../../../interfaces/AST");
function id(name) {
    return { type: 'Identifier', name };
}
exports.KNOWN_IDENTIFIERS = {
    RegExp: 'RegExp',
    boolean: 'Boolean',
    Number: 'Number',
    String: 'String',
    Function: 'Function',
    Object: 'Object',
    Symbol: 'Symbol',
    Error: 'Error',
    EvalError: 'EvalError',
    RangeError: 'RangeError',
    ReferenceError: 'ReferenceError',
    SyntaxError: 'SyntaxError',
    TypeError: 'TypeError',
    URIError: 'URIError',
    Date: 'Date',
    Array: 'Array',
    Int8Array: 'Int8Array',
    Uint8Array: 'Uint8Array',
    Uint8ClampedArray: 'Uint8ClampedArray',
    Int16Array: 'Int16Array',
    Uint16Array: 'Uint16Array',
    Int32Array: 'Int32Array',
    Uint32Array: 'Uint32Array',
    Float32Array: 'Float32Array',
    Float64Array: 'Float64Array',
    BigInt64Array: 'BigInt64Array',
    BigUint64Array: 'BigUint64Array',
    Map: 'Map',
    Set: 'Set',
    WeakMap: 'WeakMap',
    WeakSet: 'WeakSet',
    ArrayBuffer: 'ArrayBuffer',
    DataView: 'DataView',
    Promise: 'Promise',
    VoidFunction: 'Function',
    GeneratorFunction: 'Function',
    FunctionConstructor: 'Function',
    FunctionStringCallback: 'Function',
    XMLHttpRequest: 'XMLHttpRequest',
    CallableFunction: 'Object',
};
exports.voidZero = {
    type: 'UnaryExpression',
    operator: 'void',
    argument: {
        type: 'Literal',
        value: 0,
    },
    prefix: true,
};
const id_Object = id('Object');
const id_String = id('String');
const id_Number = id('Number');
const id_Array = id('Array');
const id_Function = id('Function');
const id_Boolean = id('Boolean');
const LiteralTypes = {
    string: id_String,
    number: id_Number,
    boolean: id_Boolean,
    function: id_Function,
};
function maybe(id) {
    return {
        type: 'ConditionalExpression',
        test: {
            type: 'BinaryExpression',
            left: {
                type: 'UnaryExpression',
                operator: 'typeof',
                argument: {
                    type: 'Identifier',
                    name: id,
                },
                prefix: true,
            },
            right: {
                type: 'Literal',
                value: 'function',
            },
            operator: '===',
        },
        consequent: {
            type: 'Identifier',
            name: id,
        },
        alternate: id_Object,
    };
}
function convertTypeAnnotation(node) {
    if (!node || node.type !== AST_1.ASTType.TypeAnnotation)
        return id('Object');
    const typeAnnotation = node.typeAnnotation;
    switch (typeAnnotation.type) {
        case AST_1.ASTType.BooleanKeyword:
            return id_Boolean;
        case AST_1.ASTType.NeverKeyword:
        case AST_1.ASTType.NullKeyword:
        case AST_1.ASTType.VoidKeyword:
        case AST_1.ASTType.UndefinedKeyword:
            return exports.voidZero;
        case AST_1.ASTType.AnyKeyword:
        case 'TypeOperator':
        case 'UnionType':
            return id_Object;
        case AST_1.ASTType.StringKeyword:
            return id_String;
        case AST_1.ASTType.NumberKeyword:
            return id_Number;
        case AST_1.ASTType.FunctionType:
            return id_Function;
        case AST_1.ASTType.TupleType:
        case AST_1.ASTType.ArrayType:
            return id_Array;
        case AST_1.ASTType.LiteralType:
            if (typeAnnotation.literal && typeAnnotation.literal.value !== undefined) {
                const t = typeof typeAnnotation.literal.value;
                if (LiteralTypes[t])
                    return LiteralTypes[t];
                else
                    return id_Object;
            }
        case 'TypeLiteral':
            return id_Object;
        case AST_1.ASTType.TypeReference:
            if (typeAnnotation.typeName && typeAnnotation.typeName.type === 'Identifier') {
                const known = exports.KNOWN_IDENTIFIERS[typeAnnotation.typeName.name];
                if (known)
                    return id(known);
                return maybe(typeAnnotation.typeName.name);
            }
            return id_Object;
        default:
            return id_Object;
    }
}
exports.convertTypeAnnotation = convertTypeAnnotation;