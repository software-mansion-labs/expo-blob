import * as prettier from 'prettier';
import ts from 'typescript';

import { findModuleDefinitionInFile } from './getStructure';
import { getViewTypesDeclarationsForModule, getModuleTypesDeclarationsForModule } from './mockgen';

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
  const mock = ts.factory.createNodeArray(
    getViewTypesDeclarationsForModule(outputModuleDefinition, moduleName, true)
  );
  const printedTs = printer.printList(
    ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
    mock,
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

  const mock = ts.factory.createNodeArray(
    getModuleTypesDeclarationsForModule(outputModuleDefinition, moduleName)
  );
  const printedTs = printer.printList(
    ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
    mock,
    resultFile
  );
  return await prettifyCode(printedTs, 'typescript');
}
