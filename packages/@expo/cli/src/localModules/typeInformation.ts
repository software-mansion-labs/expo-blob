import { getSwiftFileTypeInformation } from './swiftSourcekittenTypegen/swiftSourcekittenTypeInformation';

type ParametrizedType = {
  typeIdentifier: TypeIdentifier;
  parameterTypes: Type[];
};

export type ProductType = {
  types: Type[];
};

export type SumType = {
  types: Type[];
};

export type FunctionType = {
  arguments: { name: string; type: Type }[];
  returnType: Type;
};

export type OptionalType = Type;
export type ArrayType = Type;

export type TypeIdentifier = string;
export type AnonymousType =
  | ParametrizedType
  | SumType
  | ProductType
  | FunctionType
  | OptionalType
  | DictionaryType
  | ArrayType;

// const val: AnonymousType = {
//   kind: AnonymousTypeKind.PARAMETRIZED,
//   typeIdentifier: 'asfas',
//   bs: 'agabg',
// };

export enum TypeKind {
  BASIC,
  IDENTIFIER,
  PRODUCT,
  SUM,
  FUNCTION,
  PARAMETRIZED,
  OPTIONAL,
  ARRAY,
  DICTIONARY,
}

export enum BasicType {
  ANY,
  STRING,
  NUMBER,
  BOOLEAN,
  VOID,
}

export type Type = {
  kind: TypeKind;
  type: BasicType | TypeIdentifier | AnonymousType;
};

export type PropertyDeclaration = ConstantDeclaration;

export type ConstantDeclaration = {
  name: string;
  type: Type;
};

export type FunctionDeclaration = {
  name: string;
  returnType: Type;
  arguments: { name: string; typename: Type }[];
  parameters: Type[];
};

export type ConstructorDeclaration = {
  arguments: { name: string; typename: Type }[];
};

export type DictionaryType = {
  key: Type;
  value: Type;
};

export type ClassDeclaration = {
  name: string;
  constructor?: ConstructorDeclaration;
  methods: FunctionDeclaration[];
  asyncMethods: FunctionDeclaration[];
  properties: PropertyDeclaration[];
};

export type ModuleClassDeclaration = {
  name: string;
  constructor?: ConstructorDeclaration;
  constants: ConstantDeclaration[];
  classes: ClassDeclaration[];
  functions: FunctionDeclaration[];
  asyncFunctions: FunctionDeclaration[];
  properties: PropertyDeclaration[];
};

export type FileTypeInformation = {
  functions: FunctionDeclaration[];
  //   nonModuleClasses: ClassDeclaration[];
  moduleClasses: ModuleClassDeclaration[];
};

// type EitherType = {
//   types: AlgebraicType;
// };

// type ProductType = {
//   types: AlgebraicType;
// };

// enum AlgebraicTypeKind {
//   EITHER = 0,
//   PRODUCT = 1,
//   TYPENAME = 2,
// }

// type AlgebraicType = {
//   kind: AlgebraicTypeKind;
//   type: EitherType | ProductType | { typename: string };
// };

export function getFileTypeInformation(absoluteFilePath: string): FileTypeInformation | null {
  if (absoluteFilePath.endsWith('.swift')) {
    return getSwiftFileTypeInformation(absoluteFilePath);
  }
  return null;
}
