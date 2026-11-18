import unusedImports from 'eslint-plugin-unused-imports'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import tsParser from '@typescript-eslint/parser'
import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'
import storybook from 'eslint-plugin-storybook'
import { designSystemSyntaxRules } from '../../packages/views/eslint-design-system.mjs'
import noExplicitAny from '../../config/eslint/no-explicit-any.mjs'
import {
  crossFeatureImportExpressionRules,
  crossFeatureRelativeImportPatterns,
  featurePublicImportExpressionRules,
  featurePublicImportPatterns,
} from '../../config/eslint/feature-public-imports.mjs'

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

// Faker continues one shared sequence, so story data is the same in every run only if the file seeds it first
const seedFakerInStoryData = {
  selector:
    "Program:has(ImportDeclaration[source.value=/faker|builders/]):not(:has(CallExpression[callee.object.name='faker'][callee.property.name='seed']))",
  message: 'Story data must be the same in every run: call faker.seed(<number>) after the imports.',
}

const noTestDataInStories = {
  selector: 'ImportDeclaration[source.value=/\\.testData$/]',
  message: 'testData files may be random and are for tests only. Move the data a story needs to a .storyData.ts file.',
}

const storyDataRules = [seedFakerInStoryData, noTestDataInStories]

// Type-only re-exports are erased at build time, so only value re-exports count.
const noReexportRules = [
  "ExportAllDeclaration[exportKind='value']",
  "ExportNamedDeclaration[source][exportKind='value']:has(ExportSpecifier[exportKind='value'])",
].map((selector) => ({
  selector,
  message: 'Do not re-export from another module. Import the name from the file that declares it.',
}))

const nextImportRestrictions = [
  { name: 'next', importNames: ['NextPage'], message: 'Type a page as a plain function component.' },
  { name: 'next/dynamic', message: 'Import dynamic from @/utils/dynamic, which does not depend on Next.' },
  { name: 'next/app', message: 'Type the app props yourself, as pages/_app.tsx does.' },
  { name: 'next/image', message: 'Use a plain <img>. Images are served unoptimized, so next/image adds nothing.' },
]

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

      'no-restricted-imports': [
        'error',
        {
          paths: nextImportRestrictions,
          patterns: featurePublicImportPatterns,
        },
      ],

      // Design-system consistency: on <Button>, `className` is for LAYOUT only
      // (w-full, margins, grid placement). Height/padding/font-size/radius/background
      // are owned by the `size`/`variant` props — overriding them via className is what
      // makes buttons drift out of sync. If no size/variant fits a recurring need, add one
      // to packages/ui/src/primitives/button/button.tsx. See the UI/Button story + apps/web/AGENTS.md
      // ("Component variants over custom styling").
      'no-restricted-syntax': [
        'error',
        ...designSystemSyntaxRules,
        ...safeLinkWithoutSpaceIdRules,
        ...featurePublicImportExpressionRules,
      ],
    },
  },
  // No barrels in features: a re-export makes every importer depend on every re-exported file, which ties
  // features into one import cycle and makes `jest --findRelatedTests` select most of the suite.
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nextImportRestrictions,
          patterns: [...featurePublicImportPatterns, ...crossFeatureRelativeImportPatterns],
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...designSystemSyntaxRules,
        ...safeLinkWithoutSpaceIdRules,
        ...noReexportRules,
        ...featurePublicImportExpressionRules,
        ...crossFeatureImportExpressionRules,
      ],
    },
  },
  {
    files: ['src/features/*/public/**/index.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'Program', message: 'No index files in public/: name the file after what it exports.' },
      ],
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
      'no-restricted-syntax': [
        'error',
        ...designSystemSyntaxRules,
        ...noReexportRules,
        ...featurePublicImportExpressionRules,
      ],
    },
  },
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts', 'src/stories/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...designSystemSyntaxRules,
        ...storyDataRules,
        ...noReexportRules,
        ...featurePublicImportExpressionRules,
      ],
    },
  },
  {
    files: ['**/*.storyData.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...designSystemSyntaxRules,
        ...safeLinkWithoutSpaceIdRules,
        ...storyDataRules,
        ...noReexportRules,
        ...featurePublicImportExpressionRules,
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
  // Last, so no later block replaces it. public/ mirrors the private layout: only the feature-root files sit at its top level.
  {
    files: ['src/features/*/public/*.{ts,tsx}', 'src/features/*/public/*/**/*.{ts,tsx}'],
    ignores: [
      'src/features/*/public/{types,constants,utils}.ts',
      'src/features/*/public/{components,hooks,store,services,utils,__tests__}/**',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'Put public files in components/, hooks/, store/, services/ or utils/. Only types.ts, constants.ts and utils.ts sit at the top of public/.',
        },
      ],
    },
  },
]

export default config
