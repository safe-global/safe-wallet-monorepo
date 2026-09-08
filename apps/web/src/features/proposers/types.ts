import type { AddressInfo, MessageConfirmation } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

export interface DelegationOrigin {
  type: 'proposer-delegation'
  action: 'add' | 'remove'
  delegate: string
  nestedSafe: string
}

export interface PendingDelegation {
  messageHash: string
  action: 'add' | 'remove'
  delegateAddress: string
  nestedSafeAddress: string
  parentSafeAddress: string
  totp: number
  status: 'pending' | 'ready' | 'expired'
  confirmationsSubmitted: number
  confirmationsRequired: number
  confirmations: MessageConfirmation[]
  preparedSignature: string | null
  creationTimestamp: number
  proposedBy: AddressInfo
}
