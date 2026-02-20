import unusedImports from 'eslint-plugin-unused-imports'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/.github/',
      '**/cypress/',
      '**/cypress.config.js',
      '**/src/types/contracts/',
      '**/.storybook/test-runner.mjs',
      '**/.storybook/mocks/*.js',
      '**/public/mockServiceWorker.js',
    ],
  },
  ...compat.extends('next', 'prettier', 'plugin:storybook/recommended'),
  {
    plugins: {
      'unused-imports': unusedImports,
      '@typescript-eslint': typescriptEslint,
      'no-only-tests': noOnlyTests,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },

    rules: {
      '@next/next/no-img-element': 'off',
      '@next/next/google-font-display': 'off',
      '@next/next/google-font-preconnect': 'off',
      '@next/next/no-page-custom-font': 'off',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/await-thenable': 'error',
      'no-constant-condition': 'warn',

      'unused-imports/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
        },
      ],

      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: 'useAsync',
        },
      ],

      'no-only-tests/no-only-tests': 'error',
      'object-shorthand': ['error', 'properties'],
      'jsx-quotes': ['error', 'prefer-double'],

      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'never',
        },
      ],

      // Feature architecture: Prevent importing feature internals from outside the feature
      // This enforces that features expose a clean public API through their index.ts barrel file
      //
      // ALLOWED imports:
      //   @/features/myfeature              - main barrel (components via useLoadFeature, types, lightweight hooks)
      //   @/features/myfeature/store        - Redux store (slice, selectors, actions) - needed at store init
      //   @/features/myfeature/services     - services barrel (lightweight utilities only)
      //
      // FORBIDDEN imports (will cause bundle bloat):
      //   @/features/myfeature/components/* - use useLoadFeature() instead
      //   @/features/myfeature/hooks/*      - export through feature barrel if lightweight
      //   @/features/myfeature/services/*   - heavy services should be in contract, accessed via useLoadFeature()
      //
      // See apps/web/docs/feature-architecture.md for details
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            // Block deep imports into feature components (defeats lazy loading)
            {
              group: ['@/features/*/components', '@/features/*/components/**'],
              message:
                'Do not import components directly. Use useLoadFeature() to access lazy-loaded components. See docs/feature-architecture.md',
            },
            // Block deep imports into feature hooks (should go through barrel)
            {
              group: ['@/features/*/hooks', '@/features/*/hooks/**'],
              message: 'Import hooks from the feature barrel (@/features/myfeature) not from hooks folder directly.',
            },
            // Block deep imports into services internal files (barrel is OK for lightweight utils)
            {
              group: ['@/features/*/services/*', '!@/features/*/services/index'],
              message:
                'Import from @/features/myfeature/services (barrel) for lightweight utils, or use useLoadFeature() for heavy services.',
            },
            // Block deep imports into store internal files (barrel is OK)
            {
              group: ['@/features/*/store/*', '!@/features/*/store/index'],
              message: 'Import from @/features/myfeature/store (barrel) not from internal store files.',
            },
            // Block internal file imports (handle.ts is internal, only index.ts is public)
            {
              group: ['@/features/*/handle'],
              message: 'Import from feature index file only. The handle is internal - use @/features/{name} instead.',
            },
            // Same patterns for relative imports
            {
              // Same for relative imports
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
  // Override for story files: allow type-only imports from @storybook/react
  // since @storybook/nextjs re-exports these types but TypeScript doesn't always resolve them correctly
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      'storybook/no-renderer-packages': 'off',
    },
  },
]
