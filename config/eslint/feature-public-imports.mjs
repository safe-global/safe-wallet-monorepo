// Other code may import a feature only through its public/ folder.
export const featurePublicImportPatterns = [
  {
    regex: '^@/features/[^/]+(/(?!public/).*)?$',
    message: 'Import feature code only from @/features/<feature>/public/. Inside the feature, use relative imports.',
  },
]
