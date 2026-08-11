/**
 * ESM entry for the design-system lint guards, for use from a flat `eslint.config.mjs`:
 *
 *   import { designSystemRestrictedSyntax } from '@safe-global/design-system/eslint/index.mjs'
 *   // ...
 *   rules: { 'no-restricted-syntax': ['error', ...designSystemRestrictedSyntax] }
 *
 * The guards themselves live in ./rules.cjs so that Jest (CommonJS) can require them directly —
 * see rules.test.ts, which asserts each selector still fires.
 */
import rules from './rules.cjs'

export const {
  dsButtonClassnameRule,
  dsCardClassnameRule,
  dsInputClassnameRule,
  dsTabsClassnameRule,
  dsBadgeClassnameRule,
  dsDialogClassnameRule,
  designSystemRestrictedSyntax,
  designSystemFlatConfig,
} = rules

export default rules
