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
    },
  },
  {
    ignores: ['**/node_modules/', '**/src/types/contracts/'],
  },
]
