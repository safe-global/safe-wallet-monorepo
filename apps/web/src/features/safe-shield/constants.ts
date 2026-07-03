import type { Severity } from '@safe-global/utils/features/safe-shield/types'

// Enhanced mode (willingness-to-pay experiment): analysis details are shown behind a paywall overlay
export const IS_ENHANCED_MODE_ENABLED = process.env.NEXT_PUBLIC_SAFE_SHIELD_ENHANCED_MODE === 'true'
// Only Safes below this fiat balance (in the user's selected display currency) see the paywall
export const ENHANCED_MODE_BALANCE_THRESHOLD = 10_000
export const ENHANCED_MODE_PRICE_LABEL = '$0.50'
// Safe Labs-owned address the fee is sent to; the paywall is disabled unless this is a valid address
export const ENHANCED_MODE_FEE_RECIPIENT = process.env.NEXT_PUBLIC_SAFE_SHIELD_FEE_RECIPIENT || ''
// Fee in native token wei, batched into the user's transaction (~$0.50 in ETH)
export const ENHANCED_MODE_FEE_WEI = '200000000000000'

export const SEVERITY_COLORS: Record<Severity, Record<'main' | 'background', string>> = {
  CRITICAL: { main: 'var(--color-error-main)', background: 'var(--color-error-background)' },
  WARN: { main: 'var(--color-warning-main)', background: 'var(--color-warning-background)' },
  OK: { main: 'var(--color-success-main)', background: 'var(--color-success-background)' },
  INFO: { main: 'var(--color-info-main)', background: 'var(--color-info-background)' },
  ERROR: { main: 'var(--color-warning-main)', background: 'var(--color-warning-background)' },
}
