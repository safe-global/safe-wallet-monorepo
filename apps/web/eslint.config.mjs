import unusedImports from 'eslint-plugin-unused-imports'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { designSystemSyntaxRules } from '../../packages/views/eslint-design-system.mjs'
import noBarrelImports from '../../packages/views/eslint-no-barrel-imports.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

// A Safe link without `spaceId` opens the Safe outside the Workspace of the current page. Matches a
// `query` property or variable that holds such an object, directly or in a conditional.
const safeQueryWithoutSpaceId =
  "ObjectExpression:has(> Property[key.name='safe']):not(:has(> Property[key.name='spaceId'])):not(:has(> SpreadElement))"
const safeLinkWithoutSpaceIdRules = [
  `Property[key.name='query'] > ${safeQueryWithoutSpaceId}`,
  `Property[key.name='query'] > ConditionalExpression > ${safeQueryWithoutSpaceId}`,
  `VariableDeclarator[id.name='query'] > ${safeQueryWithoutSpaceId}`,
  `VariableDeclarator[id.name='query'] > ConditionalExpression > ${safeQueryWithoutSpaceId}`,
].map((selector) => ({
  selector,
  message:
    'A Safe link must keep `spaceId`: use `useSafeLinkQuery()`, or wrap the query in `withSpaceId(query, spaceId)`. If the link must leave the Workspace, add `// eslint-disable-next-line no-restricted-syntax -- <reason>`.',
}))

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
      local: noBarrelImports,
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
          ignoreRestSiblings: true,
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

      // Feature components are lazy-loaded: reach them through useLoadFeature(), never by import.
      // Everything else is imported from the file that declares it (local/no-barrel-imports below).
      // See apps/web/docs/feature-architecture.md
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'next/dynamic', message: 'Import dynamic from @/utils/dynamic, which does not depend on Next.' },
            {
              name: 'next/image',
              message: 'Use a plain <img>. Images are served unoptimized, so next/image adds nothing.',
            },
          ],
          patterns: [
            {
              group: ['@/features/*/components', '@/features/*/components/**'],
              message:
                'Do not import components directly. Use useLoadFeature() to access lazy-loaded components. See docs/feature-architecture.md',
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

      // Design-system consistency: on <Button>, `className` is for LAYOUT only
      // (w-full, margins, grid placement). Height/padding/font-size/radius/background
      // are owned by the `size`/`variant` props — overriding them via className is what
      // makes buttons drift out of sync. If no size/variant fits a recurring need, add one
      // to components/ui/button.tsx. See the UI/Button story + apps/web/AGENTS.md
      // ("Component variants over custom styling").
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules, ...safeLinkWithoutSpaceIdRules],

      'local/no-barrel-imports': [
        'error',
        {
          aliases: {
            '@/': path.join(__dirname, 'src/'),
            '@safe-global/views/': path.join(__dirname, '../../packages/views/src/'),
            '@safe-global/utils/': path.join(__dirname, '../../packages/utils/src/'),
            '@safe-global/store/': path.join(__dirname, '../../packages/store/src/'),
          },
          // generated by typechain
          ignore: ['@safe-global/utils/types/contracts'],
        },
      ],
    },
  },
  // Tests build router mocks with a bare `safe` query, so only the design-system guards apply there.
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', '**/*.stories.tsx', 'src/tests/**', 'src/stories/**'],
    rules: {
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
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
