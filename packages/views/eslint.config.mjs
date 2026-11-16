import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { plugin as shadcn } from '@shadcn/lint'
import { designSystemSyntaxRules } from './eslint-design-system.mjs'
import noExplicitAny from '../../config/eslint/no-explicit-any.mjs'

const TEST_FILES = ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}']

export default tseslint.config(
  { ignores: ['**/*.stories.tsx', '**/__mocks__/**'] },
  {
    name: 'views/production-code',
    files: ['src/**/*.{ts,tsx}'],
    ignores: TEST_FILES,
    extends: [js.configs.recommended, ...tseslint.configs.recommended, noExplicitAny],
    plugins: { 'react-hooks': reactHooks, shadcn },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'shadcn/no-raw-colors': 'error',
      'shadcn/no-arbitrary-values': 'warn',
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/image',
              message: 'Use a plain <img>. Images are served unoptimized, so next/image adds nothing.',
            },
          ],
          patterns: [
            {
              group: ['@/*', '@views/*', '**/apps/web*/**'],
              message:
                'Views must not import from an app. Move what you need into @safe-global/views or pass it in as a prop.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'views/tests',
    files: TEST_FILES,
    extends: [tseslint.configs.base, noExplicitAny],
  },
)
