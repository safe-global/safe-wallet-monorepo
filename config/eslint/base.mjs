import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * Shared ESLint base config for packages that use React + TypeScript
 * but do not need Next.js-specific rules.
 */
export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  reactHooks.configs['recommended-latest'],
  {
    settings: { react: { version: 'detect' } },
    rules: {
      // Disable prop-types — TypeScript handles type checking
      'react/prop-types': 'off',
      // Match previous eslint-config-next leniency for these rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      'no-useless-escape': 'warn',
    },
  },
]
