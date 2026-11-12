import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { plugin as shadcn } from '@shadcn/lint'
import { designSystemSyntaxRules } from './eslint/design-system.mjs'
import noExplicitAny from '../../config/eslint/no-explicit-any.mjs'

const TEST_FILES = ['**/*.test.{ts,tsx}']
const STORY_FILES = ['**/*.stories.tsx']

const noFrameworkOrDomainImports = [
  'error',
  {
    paths: [
      {
        name: 'next',
        message: 'packages/ui is framework- and domain-agnostic: no Next, no workspace packages, no app aliases.',
      },
      {
        name: 'next-themes',
        message: 'packages/ui is framework- and domain-agnostic: no Next, no workspace packages, no app aliases.',
      },
    ],
    patterns: [
      {
        group: ['next/*', '@safe-global/*', '@/*'],
        message: 'packages/ui is framework- and domain-agnostic: no Next, no workspace packages, no app aliases.',
      },
      {
        regex: '^(\\.\\./){3,}',
        message: 'Relative imports must stay inside packages/ui/src.',
      },
    ],
  },
]

export default tseslint.config(
  { ignores: ['**/*.stories.test.tsx'] },
  {
    name: 'ui/production-code',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [...TEST_FILES, ...STORY_FILES],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, noExplicitAny],
    plugins: { 'react-hooks': reactHooks, shadcn },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'shadcn/no-raw-colors': 'error',
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
    },
  },
  {
    name: 'ui/tests',
    files: TEST_FILES,
    extends: [tseslint.configs.base, noExplicitAny],
  },
  {
    name: 'ui/stories',
    files: STORY_FILES,
    extends: [tseslint.configs.base],
    // Stories keep the eslint-disable comments for the design-system rules they would trip in an app
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  {
    name: 'ui/import-boundary',
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': noFrameworkOrDomainImports },
  },
  {
    name: 'ui/layers',
    files: ['src/primitives/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          ...noFrameworkOrDomainImports[1],
          patterns: [
            ...noFrameworkOrDomainImports[1].patterns,
            {
              group: ['**/components/*', '**/components/**'],
              message: 'Primitives never import Safe components: the direction is components → primitives.',
            },
          ],
        },
      ],
    },
  },
)
