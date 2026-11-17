import { readdirSync } from 'node:fs'

const MESSAGE = 'Import feature code only from @/features/<feature>/public/. Inside the feature, use relative imports.'
const FEATURES_DIR = new URL('../../apps/web/src/features/', import.meta.url)
const FEATURE_NAMES = readdirSync(FEATURES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

// Other code may import a feature only through its public/ folder.
export const featurePublicImportPatterns = [
  { regex: '^@/features/[^/]+(/(?!public/).*)?$', message: MESSAGE },
  { regex: '^(\\.\\.?/)+(.*/)?features/[^/]+/(?!public/)', message: MESSAGE },
]

// Inside src/features, a relative path into another feature names that feature's folder, not `features/`.
export const crossFeatureRelativeImportPatterns = [
  { regex: `^(\\.\\./)+(${FEATURE_NAMES.join('|')})/(?!public/)`, message: MESSAGE },
]

// no-restricted-imports does not check import(); esquery ends a regex at the first slash, hence \x2F.
export const featurePublicImportExpressionRules = [
  {
    selector:
      'ImportExpression[source.value=/^(@\\x2F|(\\.\\.?\\x2F)+(.*\\x2F)?)features\\x2F[^\\x2F]+\\x2F(?!public\\x2F)/]',
    message: MESSAGE,
  },
]
