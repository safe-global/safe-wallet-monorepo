export type Scenario = 'everyday' | 'conflict' | 'conflict-heavy' | 'gap' | 'partial' | 'empty'
export type Direction = 'queues' | 'inbox'
export type Filter = 'all' | 'sign' | 'ready' | 'waiting' | 'awaiting'
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
export type SettingsChange = { kind: 'addOwner'; owner: string } | { kind: 'changeThreshold'; threshold: number }
export type BatchAction = { method: string; to: string; value?: string }
export type Proposal = {
  id: string
  account: string
  nonce: number
  recipient: string
  amount: string
  age: string
  signers: string[]
  eligible: boolean
  queueNextNonce?: number
  kind?: 'cancellation' | 'replacement'
  transferDirection?: 'incoming' | 'outgoing'
  note?: { text: string; author: string; date: string }
  actions?: BatchAction[]
  settingsChange?: SettingsChange
}
