import baseConfig from '../../config/eslint/base.mjs'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/build/',
      '**/vite.config.ts',
      '**/jest.config.cjs',
      '**/src/__mocks__/**',
    ],
  },
  ...baseConfig,
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
]
