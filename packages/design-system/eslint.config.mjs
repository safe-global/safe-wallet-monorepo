import baseConfig from '../../config/eslint/base.mjs'
import storybook from 'eslint-plugin-storybook'
import { designSystemRestrictedSyntax } from './eslint/index.mjs'

export default [
  ...baseConfig,
  ...storybook.configs['flat/recommended'],
  {
    ignores: ['**/node_modules/', 'storybook-static/', 'src/styles/brand-vars.css'],
  },
  {
    // The design system's own guards apply to its call sites — stories, the gallery, docs pages.
    // A story is exactly where a tempting one-off `className` shows up, so it gets the same
    // treatment as app code.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...designSystemRestrictedSyntax],
    },
  },
  {
    // …but not to the implementations. A `cva` variant IS a hard-coded `h-9 px-4`; that is the
    // whole point of defining it in one place. Turning the guards off here keeps the rule
    // meaningful everywhere else instead of forcing a disable comment on every primitive.
    files: ['src/components/**/*.tsx', 'src/presets/**/index.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // The guard module is CommonJS so Jest can require it (see eslint/rules.cjs).
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly', __dirname: 'readonly', process: 'readonly' },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/tests/**'],
    languageOptions: {
      globals: { jest: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly' },
    },
  },
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      // @storybook/react is the correct import for a framework-agnostic package.
      'storybook/no-renderer-packages': 'off',
    },
  },
]
