import baseConfig from '../../config/eslint/base.mjs'

export default [
  ...baseConfig,
  {
    ignores: ['**/node_modules/', '**/AUTO_GENERATED/'],
  },
]
