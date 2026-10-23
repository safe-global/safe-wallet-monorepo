// The workspace size. Everyday, realistic and the conflict sets are hidden fixtures that old links and tests still use.
export type Scenario =
  '1-safe' | '5-safes' | '10-safes' | '20-safes' | '50-safes' | 'everyday' | 'realistic' | 'conflict' | 'conflict-heavy'
// A moment layered on any scenario.
export type QueueState = 'normal' | 'loading' | 'error' | 'empty' | 'partial' | 'executing'
export type Direction = 'table' | 'fleet' | 'simple'
export type Filter = 'sign' | 'ready' | 'waiting' | 'awaiting'
export type Persona = 'owner' | 'single' | 'security' | 'member' | 'admin'
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
  | { kind: 'changeThreshold'; threshold: number }
  | { kind: 'enableModule'; module: string }
  | { kind: 'setGuard'; guard: string }
  | { kind: 'setFallbackHandler'; handler: string }
  | { kind: 'updateVersion'; from: string; to: string }
export type BatchAction = { method: string; to: string; value?: string }
export type TransactionKind =
  | { type: 'transfer'; toSelf?: boolean }
  | { type: 'batch'; actions: BatchAction[]; delegateCall?: 'trusted' | 'untrusted' }
  // `logo` mirrors the contract info logoUri. Without one, the row shows the code icon.
  | { type: 'contract'; contract: string; method: string; verified: boolean; steps?: string[]; logo?: string }
  | { type: 'swap'; sell: string; buy: string; order: 'market' | 'limit' | 'twap'; expiry: string; expired?: boolean }
  | { type: 'bridge'; sell: string; destination?: string; destinationChainId: string; fees: string }
  | { type: 'settings'; change: SettingsChange }
  | { type: 'nested'; parentSafe: string; parentNonce: number }
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
  // Fleet admin: why this is urgent. Shown as the drawer's first alert; its Safe is pinned to the top.
  emergency?: string
  proposedBy?: string
  note?: { text: string; author: string; date: string; onchain?: boolean }
}
