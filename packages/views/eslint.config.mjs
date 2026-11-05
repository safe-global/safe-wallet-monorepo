import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { plugin as shadcn } from '@shadcn/lint'
import { designSystemSyntaxRules } from './eslint-design-system.mjs'
import noExplicitAny from '../../config/eslint/no-explicit-any.mjs'

export default tseslint.config(
  { ignores: ['**/*.stories.tsx', '**/__mocks__/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { 'react-hooks': reactHooks, shadcn },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'shadcn/no-raw-colors': 'error',
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
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.{ts,tsx}'],
    extends: [tseslint.configs.base],
  },
  noExplicitAny,
)
