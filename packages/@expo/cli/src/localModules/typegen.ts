import { execSync } from 'child_process';
import { findModuleDefinitionsInFiles, getAllExpoModulesInWorkingDirectory } from './getStructure';
import { getViewTypesDeclarationsForModule, getModuleTypesDeclarationsForModule } from './mockgen';
import ts from 'typescript';

function getStructureFromFile(filePath: string) {
  const command = 'sourcekitten structure --file ' + filePath;

  try {
    const output = execSync(command);
    return JSON.parse(output.toString());
  } catch (error) {
    console.error('An error occurred while executing the command:', error);
  }
}

function getASTFromFile(filePath: string) {
  const command = `swiftc -dump-ast -dump-ast-format json ${filePath}`;

  try {
    const output = execSync(command);
    return JSON.parse(output.toString());
  } catch (error) {
    console.error('An error occurred while executing the command:', error);
  }
}

type TypeObject = { newTypeName: string; tsTypeName: string };

function generateTypesForObject(obj: any): TypeObject[] {
  console.log('');
  console.log('! generate types for object');
  if (obj['key.kind'] === 'source.lang.swift.decl.class') {
    console.log('! if');
    return [{ newTypeName: obj['key.name'], tsTypeName: 'any' }];
  } else if (!obj['key.substructure']) {
    console.log('! else');
    console.log('not supported!');
    return [];
  }
  console.log('! not else');
  let ret: TypeObject[] = [];
  for (const f of obj['key.substructure']) {
    console.log('!!!!!!f: ' + JSON.stringify(f, null, 2));
    ret = ret.concat(generateTypesForObject(f));
  }
  return ret;
}

export function printFileTypes(file: string): void {
  console.log('!!!');
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const resultFile = ts.createSourceFile(
    file,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );
  // const obj = getASTFromFile(file);
  // console.log(JSON.stringify(obj));

  const moduleDefinitions = findModuleDefinitionsInFiles([file]);
  for (const md of moduleDefinitions) {
    // console.log(JSON.stringify(getMockForModule(md, true), null, 2));
    // const mock = ts.factory.createNodeArray(getMockForModule(md, true));
    // const printedTs = printer.printList(
    //   ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
    //   mock,
    //   resultFile
    // );
    // console.log(printedTs);
  }

  // const generatedTypeList: { newTypeName: string; tsTypeName: string }[] = generateTypesForObject(
  //   getStructureFromFile(file)
  // );
  // // const structure = getStructureFromFile(file);
  // // console.log(JSON.stringify(getStructureFromFile(file), null, 2));
  // console.log('!!!');
  // console.log(generatedTypeList.length);

  // for (const { newTypeName, tsTypeName } of generatedTypeList) {
  //   console.log(`${newTypeName}: ${tsTypeName}`);
  // }
  // for (const structure of getStructureFromFile(file)['key.substructure']) {
  //   // console.log(JSON.stringify(structure['key.substructure'], null, 2));

  //   if (structure['key.kind'] === 'source.lang.swift.decl.class') {
  //   }
  //   console.log(JSON.stringify(structure, null, 2));
  // }
}

export function getViewTypesFileString(file: string): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const resultFile = ts.createSourceFile(
    file,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );

  const moduleDefinitions = findModuleDefinitionsInFiles([file]);
  for (const md of moduleDefinitions) {
    const mock = ts.factory.createNodeArray(getViewTypesDeclarationsForModule(md, true));
    const printedTs = printer.printList(
      ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
      mock,
      resultFile
    );
    return printedTs;
  }
  return '// Empty File';
}

export function getModuleTypesFileString(file: string): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const resultFile = ts.createSourceFile(
    file,
    '',
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX
  );
  const moduleDefinitions = findModuleDefinitionsInFiles([file]);
  for (const md of moduleDefinitions) {
    const mock = ts.factory.createNodeArray(getModuleTypesDeclarationsForModule(md));
    const printedTs = printer.printList(
      ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
      mock,
      resultFile
    );
    return printedTs;
  }
  return '// Empty File';
}

export async function printMainModuleProps(file: string) {}
