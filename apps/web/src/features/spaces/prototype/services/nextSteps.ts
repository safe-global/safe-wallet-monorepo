import type { Account, Persona, Proposal } from '../types'
import { getState } from './model'

// Dev signs each Safe with a different wallet. Some steps need a wallet switch first.
export type WalletId = 'ledger' | 'metamask'
export type Wallet = { id: WalletId; name: string; address: string }
export const WALLETS: Wallet[] = [
  { id: 'ledger', name: 'Ledger', address: '0x8f3A…2C21' },
  { id: 'metamask', name: 'MetaMask', address: '0x3c9E…7b9A' },
]
const OWNER_WALLET: Record<string, WalletId> = { treasury: 'ledger', payroll: 'metamask' }
export const getWallet = (id: WalletId) => WALLETS.find((wallet) => wallet.id === id)!
export const getOwnerWallet = (account: Pick<Account, 'id'>) => {
  const id = OWNER_WALLET[account.id]
  return id ? getWallet(id) : undefined
}

export type StepKind = 'signAndExecute' | 'execute' | 'sign' | 'signAhead'
// Ranked by what each step unblocks. A last signature or an execution moves the queue forward.
export const STEP_RANK: StepKind[] = ['signAndExecute', 'execute', 'sign', 'signAhead']

export const getStepKind = (tx: Proposal, persona: Persona): StepKind | undefined => {
  const state = getState(tx, persona)
  if (state.finalSignature) return 'signAndExecute'
  if (state.ready) return 'execute'
  if (state.canSign) return state.waiting ? 'signAhead' : 'sign'
  return undefined
}
