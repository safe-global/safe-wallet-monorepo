import unusedImports from 'eslint-plugin-unused-imports'
import noOnlyTests from 'eslint-plugin-no-only-tests'
import tsParser from '@typescript-eslint/parser'
import nextConfig from 'eslint-config-next'
import prettierConfig from 'eslint-config-prettier'
import storybook from 'eslint-plugin-storybook'

// Next 16's eslint-config-next enables the full React Compiler rule suite as errors.
// Next 15 only enforced rules-of-hooks + exhaustive-deps, so the rest flag pre-existing
// code that was never linted. Downgrade those net-new rules to 'warn' to keep the lint
// surface aligned with what dev had; adopting them as errors is a separate effort.
const REACT_COMPILER_RULES_AS_WARN = {
  'react-hooks/static-components': 'warn',
  'react-hooks/use-memo': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
  'react-hooks/incompatible-library': 'warn',
  'react-hooks/immutability': 'warn',
  'react-hooks/globals': 'warn',
  'react-hooks/refs': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/error-boundaries': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/set-state-in-render': 'warn',
  'react-hooks/unsupported-syntax': 'warn',
  'react-hooks/config': 'warn',
  'react-hooks/gating': 'warn',
}

// ESLint 9 flat config requires plugin + rules to be co-located, so inject our rule
// overrides into the same eslint-config-next objects that register each plugin.
const nextConfigWithTsRules = nextConfig.map((c) => {
  if (c.plugins && c.plugins['@typescript-eslint']) {
    return {
      ...c,
      rules: {
        ...c.rules,
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/await-thenable': 'error',
      },
    }
  }
  if (c.plugins && c.plugins['react-hooks']) {
    return {
      ...c,
      rules: {
        ...c.rules,
        ...REACT_COMPILER_RULES_AS_WARN,
      },
    }
  }
  return c
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
  ...nextConfigWithTsRules,
  prettierConfig,
  ...storybook.configs['flat/recommended'],
  {
    plugins: {
      'unused-imports': unusedImports,
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
  // Override for story files: allow type-only imports from @storybook/react
  // since @storybook/nextjs re-exports these types but TypeScript doesn't always resolve them correctly
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      'storybook/no-renderer-packages': 'off',
    },
  },
]
