export type FeePaymentMode = 'safe' | 'signer'

/** What the signer or executor picks in the fee payer selector. */
export type GasPayerChoice = 'SPONSORED' | 'PAY_FROM_SAFE' | 'WALLET'

/** The Workspace plan as the fee payment spec sees it. */
export type FeePayerPlanState = 'FREE' | 'PRO_SPONSORED_LEFT' | 'PRO_NO_SPONSORED'

/** A token the Safe can pay the fee with. */
export type GasTokenOption = { address: string; symbol: string; logoUri: string; fiatBalance?: string }

/** One row of the fee card: a priced amount, a note in its place, or a loading/error state. */
export type NetworkFee = {
  amount?: string
  currency?: string
  fiatAmount?: string
  /** Replaces the amount, e.g. "Calculated at execution". */
  note?: string
  loading?: boolean
  error?: boolean
}

/** A line of the "Total outgoing" row. */
export type OutgoingLine = { amount: string; currency: string }

/**
 * The "Pay fees from" control: a dropdown when there is a choice, a locked pill when there is not
 * (a later signer, the executor of a Safe-pays payload, or a plan with nothing to choose).
 */
export type FeePayerControl =
  { kind: 'choice'; value: GasPayerChoice; options: GasPayerChoice[] } | { kind: 'locked'; value: GasPayerChoice }

/** The strip under the fee rows: the Pro upsell on the free plan, the sponsored counter on Pro. */
export type FeePayerFooter =
  | { kind: 'upsell' }
  | {
      kind: 'counter'
      left: number | null
      quota: number | null
      resetsAt: string | null
      /** A plan's allowance per cycle (Pro), or the chain's free daily limit. */
      isSubscription: boolean
    }

/**
 * One screen of the fee card (design "Fee payment"): who pays and in which token, the Execution and
 * Gas fee rows, the total leaving the Safe, and the plan strip. The hook decides the values; the
 * selector only renders them.
 */
export type FeePayerView = {
  payer: FeePayerControl
  /** The fee token: the Safe's eligible tokens while it pays an unsigned payload, locked otherwise. */
  gasToken: { tokens: GasTokenOption[]; selected: string; locked: boolean; lockedReason?: string }
  executionFee: NetworkFee
  gasFee: NetworkFee
  /** The gas fee is covered by sponsoring: struck through, with the Pro chip. */
  sponsored: boolean
  /** What leaves the Safe: the transfer, plus the fee when the Safe pays it. */
  totalOutgoing?: { primary: OutgoingLine[]; fees?: OutgoingLine; fiatTotal: string }
  footer: FeePayerFooter
  /** Safe-pays only: false when the Safe does not hold enough of the gas token to cover the fee. */
  safeHasEnoughGas?: boolean
}
