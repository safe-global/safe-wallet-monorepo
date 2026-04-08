// Be careful what you import here as it will increase the service worker bundle size

import type { MessagePayload } from 'firebase/messaging'

export const isWebhookEvent = (data: MessagePayload['data']): data is WebhookEvent => {
  return Object.values(WebhookType).some((type) => type === data?.type)
}

export enum WebhookType {
  EXECUTED_MULTISIG_TRANSACTION = 'EXECUTED_MULTISIG_TRANSACTION',
  INCOMING_ETHER = 'INCOMING_ETHER',
  INCOMING_TOKEN = 'INCOMING_TOKEN',
  MODULE_TRANSACTION = 'MODULE_TRANSACTION',
  CONFIRMATION_REQUEST = 'CONFIRMATION_REQUEST', // Notification-specific webhook
  SAFE_CREATED = 'SAFE_CREATED',
  // Disabled on the Transaction Service
  _PENDING_MULTISIG_TRANSACTION = 'PENDING_MULTISIG_TRANSACTION',
  _NEW_CONFIRMATION = 'NEW_CONFIRMATION',
  _OUTGOING_ETHER = 'OUTGOING_ETHER',
  _OUTGOING_TOKEN = 'OUTGOING_TOKEN',
}

export type PendingMultisigTransactionEvent = {
  type: WebhookType._PENDING_MULTISIG_TRANSACTION
  chainId: string
  address: string
  safeTxHash: string
}

export type NewConfirmationEvent = {
  type: WebhookType._NEW_CONFIRMATION
  chainId: string
  address: string
  owner: string
  safeTxHash: string
}

export type OutgoingEtherEvent = {
  type: WebhookType._OUTGOING_ETHER
  chainId: string
  address: string
  txHash: string
  value: string
}

export type OutgoingTokenEvent = {
  type: WebhookType._OUTGOING_TOKEN
  chainId: string
  address: string
  tokenAddress: string
  txHash: string
  value?: string // If ERC-20 token
}

export type ExecutedMultisigTransactionEvent = {
  type: WebhookType.EXECUTED_MULTISIG_TRANSACTION
  chainId: string
  address: string
  safeTxHash: string
  failed: 'true' | 'false'
  txHash: string
}

export type IncomingEtherEvent = {
  type: WebhookType.INCOMING_ETHER
  chainId: string
  address: string
  txHash: string
  value: string
}

export type IncomingTokenEvent = {
  type: WebhookType.INCOMING_TOKEN
  chainId: string
  address: string
  tokenAddress: string
  txHash: string
  value?: string // If ERC-20 token
}

export type ModuleTransactionEvent = {
  type: WebhookType.MODULE_TRANSACTION
  chainId: string
  address: string
  module: string
  txHash: string
}

export type ConfirmationRequestEvent = {
  type: WebhookType.CONFIRMATION_REQUEST
  chainId: string
  address: string
  safeTxHash: string
}

export type SafeCreatedEvent = {
  type: WebhookType.SAFE_CREATED
  chainId: string
  address: string
  txHash: string
  blockNumber: string
}

export type WebhookEvent =
  | NewConfirmationEvent
  | ExecutedMultisigTransactionEvent
  | PendingMultisigTransactionEvent
  | IncomingEtherEvent
  | OutgoingEtherEvent
  | IncomingTokenEvent
  | OutgoingTokenEvent
  | ModuleTransactionEvent
  | ConfirmationRequestEvent
  | SafeCreatedEvent
