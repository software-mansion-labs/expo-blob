import { generateMocks } from './mockgen';
import {
  getFileTypeInformation,
  getFileTypeInformationForString,
  serializeTypeInformation,
} from './typeInformation';
import {
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from './typescriptGeneration';
import fs from 'fs';

const usage: string = `yarn expo-type-information [--typeinfo, --typegen-module, --typegen-view, --mockgen] <absoluteFilePath>
    | --typegen-module-t <fileContent>`;

if (!process.argv || process.argv.length < 3) {
  console.log('not enough arguments provided!');
  console.warn(usage);
} else {
  const command = process.argv[2];
  const fileName = process.argv[3];

  switch (command) {
    case '--typeinfo': {
      getFileTypeInformation(fileName, true).then((typeInfo) => {
        if (typeInfo) {
          const typeInfoSerialized = serializeTypeInformation(typeInfo);
          console.log(JSON.stringify(typeInfoSerialized, null, 2));
        } else {
          console.log(`Provided file: ${fileName} couldn't be parsed for type infromation!`);
        }
      });
      break;
    }
    case '--typegen-module': {
      getFileTypeInformation(fileName, true).then((typeInfo) => {
        if (typeInfo) {
          getGeneratedModuleTypesFileContent(fs.realpathSync(fileName), typeInfo).then(console.log);
        }
      });
      break;
    }
    case '--typegen-view': {
      getFileTypeInformation(fileName, true).then((typeInfo) => {
        if (typeInfo) {
          getGeneratedViewTypesFileContent(fs.realpathSync(fileName), typeInfo).then(console.log);
        }
      });
      break;
    }
    case '--mockgen': {
      getFileTypeInformation(fileName, true).then((typeInfo) => {
        if (typeInfo) {
          generateMocks([typeInfo], 'typescript');
        }
      });
      break;
    }
    case '--typegen-module-t': {
      const fileContent = process.argv[3];
      if (fileContent) {
        getFileTypeInformationForString(fileContent, 'swift').then((typeInfo) => {
          if (typeInfo) {
            getGeneratedModuleTypesFileContent(fileContent, typeInfo).then(console.log);
          }
        });
      }
      break;
    }
    default: {
      console.log('Invalid command');
      console.log(usage);
    }
  }
}
