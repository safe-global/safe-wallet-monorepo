import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    ignores: ['**/node_modules/'],
  },
]

export default eslintConfig
