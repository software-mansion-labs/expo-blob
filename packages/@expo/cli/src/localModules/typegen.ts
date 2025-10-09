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
  const moduleDefinitions = findModuleDefinitionInFile(file);
  if (!moduleDefinitions) {
    return `// The ${file} file doesn't contain module definition!`;
  }
  const mock = ts.factory.createNodeArray(
    getViewTypesDeclarationsForModule(moduleDefinitions, true)
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
  const moduleDefinitions = findModuleDefinitionInFile(file);
  if (!moduleDefinitions) {
    return `// The ${file} file doesn't contain module definition!`;
  }
  const mock = ts.factory.createNodeArray(getModuleTypesDeclarationsForModule(moduleDefinitions));
  const printedTs = printer.printList(
    ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
    mock,
    resultFile
  );
  return await prettifyCode(printedTs, 'typescript');
}
