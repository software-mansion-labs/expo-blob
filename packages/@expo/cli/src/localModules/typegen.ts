#!/usr/bin/env node
'use strict';
import * as prettier from 'prettier';
import ts from 'typescript';

import { findModuleDefinitionInFile } from './getStructure';
import {
  Closure,
  ClosureTypes,
  OutputModuleDefinition,
  OutputNestedClassDefinition,
} from './types';

/*
We receive types from SourceKitten and `getStructure` like so (examples):
[AcceptedTypes]?, UIColor?, [String: Any]

We need to parse them first to TS nodes in `mapSwiftTypeToTsType` with the following helper functions.
*/

function isSwiftArray(type: string) {
  // This can also be an object, but we check that first, so if it's not an object and is wrapped with [] it's an array.
  return type.startsWith('[') && type.endsWith(']');
}

function maybeUnwrapSwiftArray(type: string) {
  const isArray = isSwiftArray(type);
  if (!isArray) {
    return type;
  }
  const innerType = type.substring(1, type.length - 1);
  return innerType;
}

function isSwiftOptional(type: string) {
  return type.endsWith('?');
}

function maybeUnwrapSwiftOptional(type: string) {
  const isOptional = isSwiftOptional(type);
  if (!isOptional) {
    return type;
  }
  const innerType = type.substring(0, type.length - 1);
  return innerType;
}

function isSwiftDictionary(type: string) {
  return (
    type.startsWith('[') &&
    type.endsWith(']') &&
    findRootColonInDictionary(type.substring(1, type.length - 1)) >= 0
  );
}

function isEither(type: string) {
  return type.startsWith('Either<');
}

// "Either<TypeOne, TypeTwo>" -> ["TypeOne", "TypeTwo"]
function maybeUnwrapEither(type: string): string[] {
  if (!isEither(type)) {
    return [type];
  }
  const innerType = type.substring(7, type.length - 1);
  return innerType.split(',').map((t) => t.trim());
}

/*
The Swift object type can have nested objects as the type of it's values (or maybe even keys).
[String: [String: Any]]

We can't use regex to find the root colon, so this is the safest way – by counting brackets.
*/
function findRootColonInDictionary(type: string) {
  let colonIndex = -1;
  let openBracketsCount = 0;
  for (let i = 0; i < type.length; i++) {
    if (type[i] === '[') {
      openBracketsCount++;
    } else if (type[i] === ']') {
      openBracketsCount--;
    } else if (type[i] === ':' && openBracketsCount === 0) {
      colonIndex = i;
      break;
    }
  }
  return colonIndex;
}

function unwrapSwiftDictionary(type: string) {
  const innerType = type.substring(1, type.length - 1);
  const colonPosition = findRootColonInDictionary(innerType);
  return {
    key: innerType.slice(0, colonPosition).trim(),
    value: innerType.slice(colonPosition + 1).trim(),
  };
}

type TSNode =
  | ts.UnionTypeNode
  | ts.KeywordTypeNode
  | ts.TypeReferenceNode
  | ts.ArrayTypeNode
  | ts.OptionalTypeNode
  | ts.TypeLiteralNode;

/*
Main function that converts a string representation of a Swift type to a TypeScript compiler API node AST.
We can pass those types straight to a TypeScript printer (a function that converts AST to text).
*/
function mapSwiftTypeToTsType(type: string): TSNode {
  if (!type) {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
  }
  if (isSwiftOptional(type)) {
    return ts.factory.createUnionTypeNode([
      mapSwiftTypeToTsType(maybeUnwrapSwiftOptional(type)),
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    ]);
  }
  if (isSwiftDictionary(type)) {
    const { key, value } = unwrapSwiftDictionary(type);
    const keyType = mapSwiftTypeToTsType(key);
    const valueType = mapSwiftTypeToTsType(value);

    const indexSignature = ts.factory.createIndexSignature(
      undefined,
      [ts.factory.createParameterDeclaration(undefined, undefined, 'key', undefined, keyType)],
      valueType
    );

    const typeLiteralNode = ts.factory.createTypeLiteralNode([indexSignature]);
    return typeLiteralNode;
  }
  if (isSwiftArray(type)) {
    return ts.factory.createArrayTypeNode(mapSwiftTypeToTsType(maybeUnwrapSwiftArray(type)));
  }
  // Custom handling for the Either convertible
  if (isEither(type)) {
    return ts.factory.createUnionTypeNode(
      maybeUnwrapEither(type).map((t) => mapSwiftTypeToTsType(t))
    );
  }

  switch (type) {
    // Our custom representation for types that we have no type hints for. Not necessairly Swift any.
    case 'unknown':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    case 'String':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case 'Bool':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'Int':
    case 'Float':
    case 'Double':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'Any': // Swift Any type
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    default: // Custom Swift type (record) – for now mapped to a custom TS type exported at the top of the file by `getAnyTypesDeclarationsForTypenames`.
      return ts.factory.createTypeReferenceNode(type);
  }
}

function wrapWithAsync(tsType: ts.TypeNode) {
  return ts.factory.createTypeReferenceNode('Promise', [tsType]);
}

function getFunctionDeclarationInformation(func: Closure): {
  functionName: ts.Identifier;
  returnType: TSNode;
  functionParameters: ts.ParameterDeclaration[];
} {
  const functionName = ts.factory.createIdentifier(func.name);
  const returnType = mapSwiftTypeToTsType(func.types?.returnType);
  const functionParameters =
    func?.types?.parameters.map((param) =>
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        param.name ?? '_',
        undefined,
        mapSwiftTypeToTsType(param.typename),
        undefined
      )
    ) ?? [];
  return {
    functionName,
    returnType,
    functionParameters,
  };
}

function getClassMethodsDeclarations(methods: Closure[], asyncFunction = false) {
  return methods.map((method) => {
    const { functionName, returnType, functionParameters } =
      getFunctionDeclarationInformation(method);
    return ts.factory.createMethodDeclaration(
      [],
      undefined,
      functionName,
      undefined,
      undefined,
      functionParameters,
      asyncFunction ? wrapWithAsync(returnType) : returnType,
      undefined
    );
  });
}

/*
We iterate over a list of functions and we create TS AST for each of them.
*/
function getFunctionsDeclarations(functions: Closure[], asyncFunction = false) {
  return functions.map((fnStructure) => {
    const { functionName, returnType, functionParameters } =
      getFunctionDeclarationInformation(fnStructure);
    const func = ts.factory.createFunctionDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      undefined,
      functionName,
      undefined,
      functionParameters,
      asyncFunction ? wrapWithAsync(returnType) : returnType,
      undefined
    );
    return func;
  });
}

/**
 * Collect all type references used in any of the AST types to generate type aliases
 * e.g. type `[URL: string]?` will generate `type URL = any;`
 */
function getAllTypeReferences(node: ts.Node, accumulator: string[]) {
  if (ts.isTypeReferenceNode(node)) {
    accumulator.push((node.typeName as any)?.escapedText);
  }
  node.forEachChild((n) => getAllTypeReferences(n, accumulator));
}

/**
 * Iterates over types to collect the aliases.
 */
function getTypesToMock(module: OutputModuleDefinition | OutputNestedClassDefinition) {
  const foundTypes: string[] = [];

  Object.values(module)
    .flatMap((t) => (Array.isArray(t) ? t.map((t2) => (t2 as Closure)?.types) : []))
    .forEach((types: ClosureTypes | null) => {
      types?.parameters.forEach(({ typename }) => {
        getAllTypeReferences(mapSwiftTypeToTsType(typename), foundTypes);
      });
      types?.returnType &&
        getAllTypeReferences(mapSwiftTypeToTsType(types?.returnType), foundTypes);
    });
  return new Set(foundTypes);
}

/**
 * Generates any type declarations for given typenames
 */
function getAnyTypesDeclarationsForTypenames(typenames: Set<string>) {
  return Array.from(typenames).map((typename) => {
    const name = ts.factory.createIdentifier(typename);
    const typeAlias = ts.factory.createTypeAliasDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      name,
      undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    );
    return typeAlias;
  });
}

const prefix = `Automatically generated by expo-cli.

This autogenerated file provides TS types for native Expo module or view,
and works out of the box with local native modules.
`;
function getPrefix() {
  return [ts.factory.createJSDocComment(prefix)];
}

function getOneNamedImport(importedName: string, importFromName: string) {
  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      undefined,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier(importedName)
        ),
      ])
    ),
    ts.factory.createStringLiteral(importFromName),
    undefined
  );
}

function generatePropTypesForDefinition(definition: OutputNestedClassDefinition) {
  return ts.factory.createTypeAliasDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    'ViewProps',
    undefined,
    ts.factory.createTypeLiteralNode([
      ...definition.props.map((p) => {
        const propType = mapSwiftTypeToTsType(p.types.parameters[0].typename);
        return ts.factory.createPropertySignature(undefined, p.name, undefined, propType);
      }),
      ...definition.events.map((e) => {
        const eventType = ts.factory.createFunctionTypeNode(
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              'event',
              undefined,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            ),
          ],
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
        );
        return ts.factory.createPropertySignature(undefined, e.name, undefined, eventType);
      }),
    ])
  );
}

/*
Generate a class declaration for view props and functions.
*/
function getViewTypes(
  nestedClassDefinitions: OutputNestedClassDefinition[]
): (
  | ts.TypeAliasDeclaration
  | ts.VariableDeclaration
  | ts.FunctionDeclaration
  | ts.ExportAssignment
)[] {
  return nestedClassDefinitions.flatMap((definition) => {
    if (!definition) {
      console.log('!!! RIP NO DEFINITION');
      return [] as (
        | ts.TypeAliasDeclaration
        | ts.VariableDeclaration
        | ts.FunctionDeclaration
        | ts.ExportAssignment
      )[];
    }
    const propsType = generatePropTypesForDefinition(definition);
    const defaultViewDeclaration = ts.factory.createVariableDeclaration(
      'const _default',
      undefined,
      ts.factory.createTypeReferenceNode('ComponentType', [
        ts.factory.createTypeReferenceNode('ViewProps'),
      ])
    );

    const defaultViewExport = ts.factory.createExportDefault(
      ts.factory.createIdentifier('_default')
    );
    return [propsType, defaultViewDeclaration, defaultViewExport];
  });
}

function getClassDefinition(def: OutputNestedClassDefinition) {
  const classDecl = ts.factory.createClassDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(def.name),
    undefined,
    undefined,
    [
      ...getClassMethodsDeclarations(def.functions),
      ...getClassMethodsDeclarations(def.asyncFunctions, true),
    ] as ts.MethodDeclaration[]
  );
  return classDecl;
}

function getClassesDefinitions(def: OutputNestedClassDefinition[]) {
  return def.map((d) => getClassDefinition(d));
}

const newlineIdentifier = ts.factory.createIdentifier('\n\n') as any;
function separateWithNewlines<T>(arr: T) {
  return [arr, newlineIdentifier];
}

function omitFromSet(set: Set<string>, toOmit: (string | undefined)[]) {
  const newSet = new Set(set);
  toOmit.forEach((item) => {
    if (item) {
      newSet.delete(item);
    }
  });
  return newSet;
}

function getViewTypesDeclarationsForModule(
  module: OutputModuleDefinition,
  moduleName: string,
  includeTypes: boolean
) {
  return (
    [] as (
      | ts.TypeAliasDeclaration
      | ts.FunctionDeclaration
      | ts.JSDoc
      | ts.ClassDeclaration
      | ts.ImportDeclaration
    )[]
  )
    .concat(
      getPrefix(),
      newlineIdentifier,
      getOneNamedImport('ComponentType', 'React'),
      newlineIdentifier,
      includeTypes
        ? getAnyTypesDeclarationsForTypenames(
            omitFromSet(
              new Set([
                ...getTypesToMock(module),
                ...new Set(...module.views.map((v) => getTypesToMock(v))),
                ...new Set(...module.classes.map((c) => getTypesToMock(c))),
              ]),
              // Ignore all types that are actually native classes
              [
                module.name,
                ...module.views.map((c) => c.name),
                ...module.classes.map((c) => c.name),
              ]
            )
          )
        : [],
      newlineIdentifier,
      getFunctionsDeclarations(module.functions) as ts.FunctionDeclaration[],
      getFunctionsDeclarations(module.asyncFunctions, true) as ts.FunctionDeclaration[],
      newlineIdentifier,
      getViewTypes(module.views),
      getClassesDefinitions(module.classes)
    )
    .flatMap(separateWithNewlines);
}

function getTypeDeclarationsForModule(module: OutputModuleDefinition, moduleName: string | null) {
  return [
    ts.factory.createClassDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      module?.name ?? moduleName ?? 'MODULE_NAME',
      undefined,
      [
        ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
          ts.factory.createExpressionWithTypeArguments(
            ts.factory.createIdentifier('NativeModule'),
            undefined
          ),
        ]),
      ],
      ([] as ts.ClassElement[])
        .concat(
          module.properties.map((property) => {
            return ts.factory.createPropertyDeclaration(
              undefined,
              property.name,
              undefined,
              property.types?.returnType,
              undefined
            );
          })
        )
        .concat(getClassMethodsDeclarations(module.functions))
        .concat(getClassMethodsDeclarations(module.asyncFunctions, true))
        .concat(
          module.constants.map((constant) => {
            let constantType = constant.types?.returnType;
            if (!constantType || constantType === 'unknown') {
              constantType = 'any';
            }
            return ts.factory.createPropertyDeclaration(
              undefined,
              constant.name,
              undefined,
              ts.factory.createTypeReferenceNode(constantType, []),
              undefined
            );
          })
        )
    ),
    ts.factory.createVariableDeclaration(
      'const _default',
      undefined,
      ts.factory.createTypeReferenceNode(
        ts.factory.createIdentifier(moduleName ?? 'MODULE_NAME'),
        []
      )
    ),
    ts.factory.createExportDefault(ts.factory.createIdentifier('_default')),
  ];
}

function getModuleTypesDeclarationsForModule(
  module: OutputModuleDefinition,
  moduleName: string
): (
  | ts.TypeAliasDeclaration
  | ts.FunctionDeclaration
  | ts.JSDoc
  | ts.ClassDeclaration
  | ts.ImportDeclaration
)[] {
  return (
    [] as (
      | ts.TypeAliasDeclaration
      | ts.FunctionDeclaration
      | ts.JSDoc
      | ts.ClassDeclaration
      | ts.ImportDeclaration
    )[]
  ).concat(
    getPrefix(),
    newlineIdentifier,
    getOneNamedImport('NativeModule', 'expo'),
    newlineIdentifier,
    getAnyTypesDeclarationsForTypenames(
      omitFromSet(
        new Set([
          ...getTypesToMock(module),
          ...new Set(...module.views.map((v) => getTypesToMock(v))),
          ...new Set(...module.classes.map((c) => getTypesToMock(c))),
        ]),
        // Ignore all types that are actually native classes
        [module.name, ...module.views.map((c) => c.name), ...module.classes.map((c) => c.name)]
      )
    ),
    newlineIdentifier,
    getTypeDeclarationsForModule(module, moduleName)
    // getViewTypes(module.views),
    // getClassesDefinitions(module.classes)
  );
}

async function prettifyCode(text: string, parser: 'babel' | 'typescript' = 'babel') {
  return await prettier.format(text, {
    parser,
    tabWidth: 2,
    printWidth: 100,
    trailingComma: 'none',
    singleQuote: true,
  });
}

export async function getGeneratedViewTypesFileContent(file: string): Promise<string> {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const resultFile = ts.createSourceFile(
    file,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );
  const { outputModuleDefinition, moduleName } = findModuleDefinitionInFile(file) ?? {
    outputModuleDefinition: null,
    moduleName: null,
  };
  if (!outputModuleDefinition) {
    return `// The ${file} file doesn't contain module definition!`;
  }
  const viewTypes = ts.factory.createNodeArray(
    getViewTypesDeclarationsForModule(outputModuleDefinition, moduleName, true)
  );
  const printedTs = printer.printList(
    ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
    viewTypes,
    resultFile
  );
  return await prettifyCode(printedTs, 'typescript');
}

export async function getGeneratedModuleTypesFileContent(file: string): Promise<string> {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const resultFile = ts.createSourceFile(
    file,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );
  const { outputModuleDefinition, moduleName } = findModuleDefinitionInFile(file) ?? {
    outputModuleDefinition: null,
    moduleName: null,
  };
  if (!outputModuleDefinition) {
    return `// The ${file} file doesn't contain module definition!`;
  }

  const moduleTypes = ts.factory.createNodeArray(
    getModuleTypesDeclarationsForModule(outputModuleDefinition, moduleName)
  );
  const printedTs = printer.printList(
    ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
    moduleTypes,
    resultFile
  );
  return await prettifyCode(printedTs, 'typescript');
}
