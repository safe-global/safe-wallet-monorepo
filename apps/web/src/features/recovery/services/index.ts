// Lightweight recovery services barrel.
//
// IMPORTANT: do not re-export anything from `recovery-sender.ts` here —
// that file imports `@gnosis.pm/zodiac` at the top level and webpack treats
// barrels as side-effectful, so a single eager import of `proxies` utilities
// via this barrel would pull zodiac (~120 KB gzipped) into the global bundle.
// Heavy services like `getDelayModifierContract` must be imported directly
// from inside lazy feature chunks (with an `eslint-disable no-restricted-imports`
// comment, since the rule otherwise pushes deep imports through this barrel).
export * from './proxies'
