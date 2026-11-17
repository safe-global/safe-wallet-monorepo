const MESSAGE = 'Import feature code only from @/features/<feature>/public/. Inside the feature, use relative imports.'

// Other code may import a feature only through its public/ folder.
export const featurePublicImportPatterns = [
  { regex: '^@/features/[^/]+(/(?!public/).*)?$', message: MESSAGE },
  { regex: '^(\\.\\.?/)+(.*/)?features/[^/]+/(?!public/)', message: MESSAGE },
]

// no-restricted-imports does not check import(); esquery ends a regex at the first slash, hence \x2F.
export const featurePublicImportExpressionRules = [
  {
    selector: 'ImportExpression[source.value=/^@\\x2Ffeatures\\x2F[^\\x2F]+\\x2F(?!public\\x2F)/]',
    message: MESSAGE,
  },
]
