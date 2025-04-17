import { EventType } from '../types'

export enum TX_TYPES {
  // Settings
  owner_add = 'owner_add',
  owner_remove = 'owner_remove',
  owner_swap = 'owner_swap',
  owner_threshold_change = 'owner_threshold_change',

  // Module txs
  guard_remove = 'guard_remove',
  module_remove = 'module_remove',

  // Transfers
  transfer_token = 'transfer_token',
  batch_transfer_token = 'batch_transfer_token',
  transfer_nft = 'transfer_nft',

  // Other
  batch = 'batch',
  rejection = 'rejection',
  typed_message = 'typed_message',
  nested_safe = 'nested_safe',
  walletconnect = 'walletconnect',
  custom = 'custom',
  native_bridge = 'native_bridge',
  native_swap = 'native_swap',
  bulk_execute = 'bulk_execute',

  // Counterfactual
  activate_without_tx = 'activate_without_tx',
  activate_with_tx = 'activate_with_tx',
}

const TX_CATEGORY = 'transactions'

export const TX_EVENTS = {
  CREATE: {
    event: EventType.TX_CREATED,
    action: 'Create transaction',
    category: TX_CATEGORY,
    // label: TX_TYPES,
  },
  CREATE_VIA_ROLE: {
    event: EventType.TX_CREATED,
    action: 'Create via role',
    category: TX_CATEGORY,
  },
  CREATE_VIA_SPENDING_LIMTI: {
    event: EventType.TX_CREATED,
    action: 'Create via spending limit',
    category: TX_CATEGORY,
  },
  CREATE_VIA_PROPOSER: {
    event: EventType.TX_CREATED,
    action: 'Create via proposer',
    category: TX_CATEGORY,
  },
  CONFIRM: {
    event: EventType.TX_CONFIRMED,
    action: 'Confirm transaction',
    category: TX_CATEGORY,
  },
  EXECUTE: {
    event: EventType.TX_EXECUTED,
    action: 'Execute transaction',
    category: TX_CATEGORY,
  },
  SPEED_UP: {
    event: EventType.TX_EXECUTED,
    action: 'Speed up transaction',
    category: TX_CATEGORY,
  },
  EXECUTE_VIA_SPENDING_LIMIT: {
    event: EventType.TX_EXECUTED,
    action: 'Execute via spending limit',
    category: TX_CATEGORY,
  },
  EXECUTE_VIA_ROLE: {
    event: EventType.TX_EXECUTED,
    action: 'Execute via role',
    category: TX_CATEGORY,
  },
  CREATE_VIA_PARENT: {
    event: EventType.TX_CREATED,
    action: 'Create via parent',
    category: TX_CATEGORY,
  },
  CONFIRM_VIA_PARENT: {
    event: EventType.TX_CREATED,
    action: 'Confirm via parent',
    category: TX_CATEGORY,
  },
  EXECUTE_VIA_PARENT: {
    event: EventType.TX_CREATED,
    action: 'Execute via parent',
    category: TX_CATEGORY,
  },
  CONFIRM_IN_PARENT: {
    event: EventType.TX_CONFIRMED,
    action: 'Confirm in parent',
    category: TX_CATEGORY,
  },
  EXECUTE_IN_PARENT: {
    event: EventType.TX_EXECUTED,
    action: 'Execute in parent',
    category: TX_CATEGORY,
  },
}
