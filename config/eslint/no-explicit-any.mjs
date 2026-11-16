import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'

// Existing violations are listed in each workspace's eslint-suppressions.json, so only new ones fail.
export default {
  files: ['**/*.{ts,tsx,mts,cts}'],
  plugins: { '@eslint-community/eslint-comments': eslintComments },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@eslint-community/eslint-comments/no-restricted-disable': ['error', '@typescript-eslint/no-explicit-any'],
  },
}
