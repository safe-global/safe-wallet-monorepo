export type Scenario = 'everyday' | 'realistic' | 'conflict' | 'conflict-heavy' | 'gap' | 'partial' | 'empty'
export type Direction = 'queues' | 'inbox'
export type Filter = 'sign' | 'ready' | 'waiting' | 'awaiting'
export type Persona = 'owner' | 'observer'
export type Account = {
  id: string
  name: string
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
  | { type: 'contract'; contract: string; method: string; verified: boolean; steps?: string[] }
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
  proposedBy?: string
  note?: { text: string; author: string; date: string }
}
