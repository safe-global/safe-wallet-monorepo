// The workspace size. Everyday, realistic and the conflict sets are hidden fixtures that old links and tests still use.
export type Scenario =
  | '1-safe'
  | '5-safes'
  | '8-safes'
  | '10-safes'
  | '20-safes'
  | '50-safes'
  | 'everyday'
  | 'realistic'
  | 'conflict'
  | 'conflict-heavy'
// A moment layered on any scenario.
// `capped`: the gateway stopped reading past 500 transactions. `incoming`: a refresh brings in a new proposal.
export type QueueState = 'normal' | 'loading' | 'error' | 'empty' | 'partial' | 'executing' | 'capped' | 'incoming'
// M1 is what ships first. M2 adds the drawer, bulk execute, Remind, Safenet marks and nested Safes. Hypernative status shows in both.
export type Milestone = 1 | 2
// Without a wallet, nothing can say what needs your signature. Viewing still works, as for an admin checking in.
export type WalletState = 'connected' | 'none'
export type Filter = 'sign' | 'ready' | 'waiting' | 'awaiting'
// `guest`: whoever opens the queue with no wallet connected. Not in the persona picker.
export type Persona = 'owner' | 'single' | 'security' | 'member' | 'admin' | 'guest'
export type Account = {
  id: string
  name: string
  // The Safe's name without its network, when the same Safe is on several networks.
  safeName?: string
  network: string
  chainId: string
  address: string
  iconAddress: string
  owners: string[]
  nextNonce: number
  threshold: number
}
export type SettingsChange =
  | { kind: 'addOwner'; owner: string }
  | { kind: 'removeOwner'; owner: string }
  | { kind: 'swapOwner'; oldOwner: string; newOwner: string }
  | { kind: 'changeThreshold'; threshold: number }
  | { kind: 'enableModule'; module: string }
  | { kind: 'disableModule'; module: string }
  | { kind: 'setGuard'; guard: string }
  | { kind: 'removeGuard' }
  | { kind: 'setFallbackHandler'; handler: string }
  | { kind: 'updateVersion'; from: string; to: string }
export type BatchAction = { method: string; to: string; value?: string }
export type TransactionKind =
  | { type: 'transfer'; toSelf?: boolean }
  | { type: 'batch'; actions: BatchAction[]; delegateCall?: 'trusted' | 'untrusted' }
  // `logo` mirrors the contract info logoUri. Without one, the row shows the code icon.
  // `method` is empty when the gateway can't decode the call data: the row reads "Unknown method".
  | { type: 'contract'; contract: string; method: string; verified: boolean; steps?: string[]; logo?: string }
  | { type: 'swap'; sell: string; buy: string; order: 'market' | 'limit' | 'twap'; expiry: string; expired?: boolean }
  | { type: 'bridge'; sell: string; destination?: string; destinationChainId: string; fees: string }
  | { type: 'settings'; change: SettingsChange }
  | { type: 'nested'; parentSafe: string; parentNonce: number }
  // Native staking through Kiln, with production's names: Stake, Withdraw request, Claim.
  | { type: 'staking'; action: 'stake' | 'withdrawRequest' | 'claim'; validators?: number }
  | { type: 'rejection' }
export type Proposal = {
  id: string
  account: string
  nonce: number
  recipient: string
  amount: string
  // Left out where the token already reads as dollars.
  fiat?: string
  age: string
  signers: string[]
  eligible: boolean
  queueNextNonce?: number
  kind: TransactionKind
  origin?: 'replacement'
  // The Safe App the transaction was created in, as safeAppInfo in production.
  app?: { name: string; logo?: string }
  // Why this is urgent. Shown as the drawer's first alert.
  emergency?: string
  proposedBy?: string
  note?: { text: string; author: string; date: string; onchain?: boolean }
}
