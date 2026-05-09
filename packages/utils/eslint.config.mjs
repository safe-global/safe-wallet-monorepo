import baseConfig from '../../config/eslint/base.mjs'

export default [
  ...baseConfig,
  {
    rules: {
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: 'useAsync',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['**/node_modules/', '**/src/types/contracts/'],
  },
]
