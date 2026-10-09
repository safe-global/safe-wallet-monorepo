import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import { designSystemSyntaxRules } from './eslint-design-system.mjs'

export default tseslint.config(
  { ignores: ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', '**/__tests__/**', '**/__mocks__/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': ['error', ...designSystemSyntaxRules],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*', '@views/*'],
              message:
                'Views must not import from an app. Move what you need into @safe-global/views or pass it in as a prop.',
            },
          ],
        },
      ],
    },
  },
)
