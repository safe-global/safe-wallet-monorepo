import tsParser from '@typescript-eslint/parser'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import unusedImports from 'eslint-plugin-unused-imports'
import js from '@eslint/js'

// Minimal flat config for the migration app. Mirrors the high-value rules
// from apps/web/eslint.config.mjs without pulling in next/storybook plugins,
// which would conflict with the Vite/TanStack target.
export default [
  {
    ignores: ['**/node_modules/', '**/dist/', '**/cypress/', '**/cypress.config.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        URLSearchParams: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLImageElement: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]
