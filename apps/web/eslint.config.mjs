import unusedImports from 'eslint-plugin-unused-imports'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import tsParser from '@typescript-eslint/parser'
import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'
import storybook from 'eslint-plugin-storybook'
import { designSystemSyntaxRules } from '../../packages/views/eslint-design-system.mjs'
import noExplicitAny from '../../config/eslint/no-explicit-any.mjs'

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

// Imports that app code must not use; story files add their own restrictions on top (see below)
const restrictedImports = {
  paths: [
    { name: 'next', importNames: ['NextPage'], message: 'Type a page as a plain function component.' },
    { name: 'next/dynamic', message: 'Import dynamic from @/utils/dynamic, which does not depend on Next.' },
    { name: 'next/app', message: 'Type the app props yourself, as pages/_app.tsx does.' },
    {
      name: 'next/image',
      message: 'Use a plain <img>. Images are served unoptimized, so next/image adds nothing.',
    },
  ],
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
}

const config = [
  {
    ignores: [
      '**/node_modules/',
      '**/.next/',
      '**/.github/',
      '**/src/types/contracts/',
      '**/.storybook/test-runner.mjs',
      '**/.storybook/mocks/*.js',
      '**/public/mockServiceWorker.js',
      '**/public/step-up-complete.js',
    ],
  },
  ...next,
  prettier,
  ...storybook.configs['flat/recommended'],
  {
    // Same files as eslint-config-next, which registers the react-hooks plugin only for these.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
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
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],

      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: 'useAsync',
        },
      ],
      // React Compiler rules from eslint-plugin-react-hooks 7. The app does not use the compiler yet.
      'react-hooks/config': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/use-memo': 'off',

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
      'no-restricted-imports': ['error', restrictedImports],

      // Design-system consistency: on <Button>, `className` is for LAYOUT only
      // (w-full, margins, grid placement). Height/padding/font-size/radius/background
      // are owned by the `size`/`variant` props — overriding them via className is what
      // makes buttons drift out of sync. If no size/variant fits a recurring need, add one
      // to components/ui/button.tsx. See the UI/Button story + apps/web/AGENTS.md
      // ("Component variants over custom styling").
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules, ...safeLinkWithoutSpaceIdRules],
    },
  },
  // The isolated-stack mocks run in Node with their own compiler settings, which the main tsconfig excludes.
  {
    files: ['e2e/environment/infra/mocks/*.ts'],
    languageOptions: { parserOptions: { project: ['./e2e/environment/infra/mocks/tsconfig.json'] } },
  },
  // No tsconfig includes JavaScript, so these files get only the rules that need no type information.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { parserOptions: { project: null } },
    rules: { '@typescript-eslint/await-thenable': 'off' },
  },
  noExplicitAny,
  // Tests build router mocks with a bare `safe` query, so only the design-system guards apply there.
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', '**/*.stories.tsx', 'src/tests/**', 'src/stories/**'],
    rules: {
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
    },
  },
  // Stories must render the same data every time: no faker and no test builders, which are random by design
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts', '**/mockData.ts', '**/storyExamples.ts', 'src/stories/**'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...restrictedImports.paths,
            {
              name: '@faker-js/faker',
              message: 'Stories need fixed data: use the fixtures, createMockStory, mockAddress() or literal values.',
            },
          ],
          patterns: [
            ...restrictedImports.patterns,
            {
              group: ['@/tests/builders', '@/tests/builders/**', '@safe-global/utils/tests/builders/**'],
              message:
                'Test builders are random by design. Use the fixtures, createMockStory or literal values in stories.',
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

export default config
