export type GtfPaymentMode = 'safe' | 'signer'

/** What the signer or executor picks in the fee payer selector. */
export type GasPayerChoice = 'SPONSORED' | 'PAY_FROM_SAFE' | 'WALLET'

/** The Workspace plan as the fee payment spec sees it. */
export type FeePayerPlanState = 'FREE' | 'PRO_SPONSORED_LEFT' | 'PRO_NO_SPONSORED'

/** A token the Safe can pay the fee with. */
export type GasTokenOption = { address: string; symbol: string; logoUri: string; fiatBalance?: string }

/** The single "Network fee" row. */
export type NetworkFee = {
  amount?: string
  currency?: string
  fiatAmount?: string
  /** Replaces the amount, e.g. "Calculated at execution". */
  note?: string
  loading?: boolean
  error?: boolean
}

/**
 * One screen of the fee payment spec. The hook decides which one applies; the selector only renders it.
 * - `locked`: Pay from Safe was picked at signing — a read-only line, no radio, no border.
 * - `sponsored_info`: Pro with sponsored transactions left, at the sign step — nothing to choose.
 * - `sponsored_toggle`: Sponsored · n/m vs Pay from signer, at execution.
 * - `safe_toggle`: Pay from signer vs Pay from Safe (fee, "+ premium" on the free plan), at signing.
 * - `signer_only`: one option, shown as text, with the quota message or the Pro upsell.
 */
export type FeePayerView =
  | { kind: 'locked'; fee: NetworkFee }
  | { kind: 'sponsored_info' }
  | {
      kind: 'sponsored_toggle'
      choice: Extract<GasPayerChoice, 'SPONSORED' | 'WALLET'>
      /** "49/50", "1/1 today" or "Unlimited". */
      counter: string
      signerFee: NetworkFee
    }
  | {
      kind: 'safe_toggle'
      choice: Extract<GasPayerChoice, 'PAY_FROM_SAFE' | 'WALLET'>
      safeFee: NetworkFee
      signerFee: NetworkFee
      /** Free plan: the fee carries a premium. */
      premium: boolean
      /** This signature reaches the threshold, so "Sign and execute" is on the CTA. */
      reachesThreshold: boolean
      /** Tokens the Safe holds that may pay the fee (native first, then the allowlisted stablecoins). */
      gasTokens: GasTokenOption[]
      selectedGasToken: string
    }
  | {
      kind: 'signer_only'
      reason: 'quota' | 'free'
      /** ISO; the quota message names the reset date. */
      resetsAt: string | null
      signerFee: NetworkFee
    }
