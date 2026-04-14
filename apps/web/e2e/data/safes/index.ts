/**
 * Safe fixture registry — TypeScript port of cypress/support/safes/safesHandler.js
 *
 * Unlike the Cypress version, no async loading is needed — we import directly.
 */
import staticSafes from './static'

export { default as staticSafes } from './static'
export type { StaticSafes, StaticSafeKey } from './static'

export const CATEGORIES = {
  static: 'static',
  funds: 'funds',
  nfts: 'nfts',
  safeapps: 'safeapps',
  recovery: 'recovery',
} as const

export type Category = keyof typeof CATEGORIES

/** Direct access to static safes (most common usage) */
export function getStaticSafes() {
  return staticSafes
}
