import type { FeePayerView } from '@safe-global/views/features/fee-payment/types'

export type GasEstimate = { userNonce: string; gasLimit: string; maxPriorityFeeGwei: string; maxFeeGwei: string }

export type SafeQuote = { gasLimit: string; gasPriceGwei: string }

export type Scenario = {
  payer: FeePayerView['payer']
  footer: FeePayerView['footer']
  sponsorKind: FeePayerView['sponsorKind']
  /** gasLimit is empty when it cannot be estimated. */
  estimate: GasEstimate
  safeQuote: SafeQuote
}

export const ETH_USD = 3650

export const ETH_TOKEN = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
}

const ESTIMATE: GasEstimate = {
  userNonce: '12',
  gasLimit: '79262',
  maxPriorityFeeGwei: '0.05',
  maxFeeGwei: '1.82',
}

const SAFE_QUOTE: SafeQuote = { gasLimit: '112400', gasPriceGwei: '1.9' }

const UPSELL: FeePayerView['footer'] = { kind: 'upsell' }

const signerCanPickSafe = {
  payer: { kind: 'choice', value: 'WALLET', options: ['PAY_FROM_SAFE', 'WALLET'] },
  footer: UPSELL,
  sponsorKind: 'plan',
  estimate: ESTIMATE,
  safeQuote: SAFE_QUOTE,
} satisfies Scenario

export const SCENARIOS = {
  signerWallet: signerCanPickSafe,
  cannotEstimate: { ...signerCanPickSafe, estimate: { ...ESTIMATE, gasLimit: '' } },
  paidFromSafe: { ...signerCanPickSafe, payer: { kind: 'locked', value: 'PAY_FROM_SAFE' }, footer: { kind: 'none' } },
  proPlan: {
    ...signerCanPickSafe,
    payer: { kind: 'choice', value: 'SPONSORED', options: ['SPONSORED', 'WALLET'] },
    footer: { kind: 'counter', left: 37, quota: 50, resetsAt: '2026-12-01T00:00:00Z', isSubscription: true },
  },
} satisfies Record<string, Scenario>

export type ScenarioId = keyof typeof SCENARIOS
