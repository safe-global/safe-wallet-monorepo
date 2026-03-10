import type { AddressInfo, MessageConfirmation } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

export interface DelegationOrigin {
  type: 'proposer-delegation'
  action: 'add' | 'remove' | 'edit'
  delegate: string
  nestedSafe: string
  label: string
}

export interface PendingDelegation {
  messageHash: string
  action: 'add' | 'remove' | 'edit'
  delegateAddress: string
  delegateLabel: string
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
