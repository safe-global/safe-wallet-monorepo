import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import nextVitals from 'eslint-config-next/core-web-vitals'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const typeScriptRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
}

const withTypeScriptRules = (configs) => {
  let hasTypeScriptPlugin = false

  const updatedConfigs = configs.map((config) => {
    if (!config.plugins || !config.plugins['@typescript-eslint']) {
      return config
    }

    hasTypeScriptPlugin = true

    return {
      ...config,
      languageOptions: {
        ...config.languageOptions,
        parser: tsParser,
        ecmaVersion: config.languageOptions?.ecmaVersion ?? 2020,
        sourceType: config.languageOptions?.sourceType ?? 'module',
        parserOptions: {
          ...config.languageOptions?.parserOptions,
        },
      },
      rules: {
        ...config.rules,
        ...typeScriptRules,
      },
    }
  })

  if (hasTypeScriptPlugin) {
    return updatedConfigs
  }

  return [
    ...updatedConfigs,
    {
      plugins: {
        '@typescript-eslint': typescriptEslint,
      },
      languageOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      rules: typeScriptRules,
    },
  ]
}

export default [
  {
    ignores: ['**/node_modules/', '**/build/', '**/vite.config.ts', '**/jest.config.cjs', '**/src/__mocks__/**'],
  },
  ...withTypeScriptRules(nextVitals),
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
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
]
