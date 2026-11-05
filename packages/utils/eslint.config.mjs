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
    ignores: ['**/node_modules/', '**/src/types/contracts/'],
  },
]
