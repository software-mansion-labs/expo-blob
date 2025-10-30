import { getSwiftFileTypeInformation } from './swiftSourcekittenTypegen/swiftSourcekittenTypeInformation';

type ParametrizedType = {
  typeIdentifier: TypeIdentifier;
  parameterTypes: Type[];
};

export enum AnonymousTypeKind {
  PRODUCT,
  SUM,
  FUNCTION,
  PARAMETRIZED,
}

type ProductType = {
  bs: string;
};

type SumType = {};

type FunctionType = {};

type TypeIdentifier = string;
type AnonymousType = {
  kind: AnonymousTypeKind;
} & (ParametrizedType | SumType | ProductType | FunctionType);

// const val: AnonymousType = {
//   kind: AnonymousTypeKind.PARAMETRIZED,
//   typeIdentifier: 'asfas',
//   bs: 'agabg',
// };

export enum TypeKind {
  IDENTIFIER,
  ANONYMOUS,
}

export type Type = {
  kind: TypeKind;
  type: TypeIdentifier | AnonymousType;
};

export type PropertyDeclaration = ConstantDeclaration;

export type ConstantDeclaration = {
  name: string;
  typename: string;
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
