import tsParser from '@typescript-eslint/parser'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import unusedImports from 'eslint-plugin-unused-imports'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import prettier from 'eslint-config-prettier'
import js from '@eslint/js'

// Mirrors apps/web/eslint.config.mjs rule-by-rule, minus the framework
// extends (`next`, `plugin:storybook/recommended`) which aren't applicable
// to the Vite + TanStack Router target. Kept in sync so reused source under
// @/* gets the same quality bar in both workspaces.
export default [
  {
    ignores: ['**/node_modules/', '**/dist/', '**/cypress/', '**/cypress.config.js'],
  },
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
      'no-only-tests': noOnlyTests,
      'react-hooks': reactHooks,
      react,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
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
      '@typescript-eslint/await-thenable': 'error',
      'no-constant-condition': 'warn',
      'react-hooks/exhaustive-deps': ['warn', { additionalHooks: 'useAsync' }],
      'no-only-tests/no-only-tests': 'error',
      'object-shorthand': ['error', 'properties'],
      'jsx-quotes': ['error', 'prefer-double'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],

      // Feature architecture — same patterns as apps/web. Reused @/features/*
      // code resolves through the @/* alias in tsconfig, so the same import
      // restrictions apply.
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/features/*/components', '@/features/*/components/**'],
              message:
                'Do not import components directly. Use useLoadFeature() to access lazy-loaded components. See docs/feature-architecture.md',
            },
            {
              group: ['@/features/*/hooks', '@/features/*/hooks/**'],
              message: 'Import hooks from the feature barrel (@/features/myfeature) not from hooks folder directly.',
            },
            {
              group: ['@/features/*/services/*', '!@/features/*/services/index'],
              message:
                'Import from @/features/myfeature/services (barrel) for lightweight utils, or use useLoadFeature() for heavy services.',
            },
            {
              group: ['@/features/*/store/*', '!@/features/*/store/index'],
              message: 'Import from @/features/myfeature/store (barrel) not from internal store files.',
            },
            {
              group: ['@/features/*/handle'],
              message: 'Import from feature index file only. The handle is internal - use @/features/{name} instead.',
            },
            {
              group: [
                '../features/*/components',
                '../features/*/components/**',
                '../../features/*/components',
                '../../features/*/components/**',
              ],
              message: 'Do not import components directly. Use useLoadFeature() instead.',
            },
          ],
        },
      ],
    },
  },
]
