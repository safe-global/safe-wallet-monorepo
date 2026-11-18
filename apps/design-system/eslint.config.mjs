import { designSystemSyntaxRules } from '@safe-global/ui/eslint'
import base from '../../config/eslint/base.mjs'

export default [
  { ignores: ['src/generated/**', '.source/**', '.next/**', 'out/**', 'registry/**', 'public/**'] },
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
    },
  },
]
