export type FeeRow = {
  label: string
  amount?: string
  currency?: string
  fiatAmount?: string
  isFree?: boolean
  /** When set, replaces the amount/currency/fiat slot with explanatory copy (e.g. "Calculated at execution"). */
  note?: string
}

export type HistoryFeesData = {
  totalFee: { amount: string; currency: string; fiatAmount?: string }
  executionFee: FeeRow
  gasFee: FeeRow
  paidFrom: 'safe' | 'signer'
}

export type GasPayerChoice = 'SPONSORED' | 'PAY_FROM_SAFE' | 'WALLET'

export type GasTokenOption = { address: string; symbol: string; logoUri: string; fiatBalance?: string }

export type NetworkFee = {
  amount?: string
  currency?: string
  fiatAmount?: string
  note?: string
  loading?: boolean
  error?: boolean
}

export type OutgoingLine = { amount: string; currency: string }

export type TotalOutgoingView = { primary: OutgoingLine[]; fees?: OutgoingLine; fiatTotal: string }

/** Why the payer is locked, when it is not the default for its value. The view picks the copy. */
export type PayerLockReason = 'FIRST_SIGNER_PICKS'

/** Why the fee token is locked. Without one the view explains the signer-pays case. */
export type GasTokenLockReason = 'SET_AT_SIGNING' | 'NATIVE_ONLY' | 'SPONSORED'

export type FeePayerControl =
  | { kind: 'choice'; value: GasPayerChoice; options: GasPayerChoice[] }
  | { kind: 'locked'; value: GasPayerChoice; reason?: PayerLockReason }

export type FeePayerFooter =
  | { kind: 'none' }
  | { kind: 'upsell' }
  | { kind: 'counter'; left: number | null; quota: number | null; resetsAt: string | null; isSubscription: boolean }
  | { kind: 'campaign'; left: number; limit: number }

export type FeePayerView = {
  payer: FeePayerControl
  gasToken: { tokens: GasTokenOption[]; selected: string; locked: boolean; lockedReason?: GasTokenLockReason }
  executionFee: NetworkFee
  gasFee: NetworkFee
  sponsored: boolean
  /** The Workspace's plan ("Pro plan") or the chain's free relays ("Free transaction"). */
  sponsorKind: 'plan' | 'free'
  totalOutgoing?: TotalOutgoingView
  footer: FeePayerFooter
  /** Safe-pays only: false when the Safe cannot cover the fee. */
  safeHasEnoughGas?: boolean
}

/** A gas setting of the transaction, as shown in the Gas fee details. `gasPrice` is the max fee on chains without EIP-1559. */
export type GasDetailName = 'userNonce' | 'gasLimit' | 'maxPriorityFeePerGas' | 'maxFeePerGas' | 'gasPrice'

/** Why an edited gas setting can't be saved. The view picks the copy. */
export type GasParamError = 'REQUIRED' | 'NOT_INTEGER' | 'BELOW_MIN_GAS_LIMIT' | 'INVALID_AMOUNT' | 'BELOW_PRIORITY_FEE'

/** Why the gas settings are read-only. The view picks the copy. */
export type GasDetailsReadOnlyReason = 'PAID_FROM_SAFE' | 'SPONSORED_PLAN' | 'SPONSORED_FREE'

export type GasParamField = {
  name: GasDetailName
  value: string
  error?: GasParamError
  autoFocus?: boolean
}

/** `value` is missing while it is still loading; `error` when it can't be estimated. */
export type GasDetailRow = { name: GasDetailName; value?: string; error?: boolean }

/** The Gas fee row's details: an inline editor when the signer wallet pays, read-only otherwise. */
export type GasFeeDetails = { open: boolean; onOpenChange: (open: boolean) => void } & (
  | {
      mode: 'edit'
      fields: GasParamField[]
      onFieldChange: (name: GasDetailName, value: string) => void
      canSave: boolean
      onSave: () => void
      onCancel: () => void
      /** Shown only when the values differ from the estimate. */
      onReset?: () => void
    }
  | { mode: 'view'; rows: GasDetailRow[]; reason: GasDetailsReadOnlyReason }
)
