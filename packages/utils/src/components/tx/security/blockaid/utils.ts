import type {
  ModulesChangeManagement,
  OwnershipChangeManagement,
  ProxyUpgradeManagement,
} from '@safe-global/utils/services/security/modules/BlockaidModule/types'

export const REASON_MAPPING: Record<string, string> = {
  raw_ether_transfer: 'transfers native currency',
  signature_farming: 'is a raw signed transaction',
  transfer_farming: 'transfers tokens',
  approval_farming: 'approves erc20 tokens',
  set_approval_for_all: 'approves all tokens of the account',
  permit_farming: 'authorizes access or permissions',
  seaport_farming: 'authorizes transfer of assets via Opeansea marketplace',
  blur_farming: 'authorizes transfer of assets via Blur marketplace',
  delegatecall_execution: 'involves a delegate call',
}
export const CLASSIFICATION_MAPPING: Record<string, string> = {
  known_malicious: 'to a known malicious address',
  unverified_contract: 'to an unverified contract',
  new_address: 'to a new address',
  untrusted_address: 'to an untrusted address',
  address_poisoning: 'to a poisoned address',
  losing_mint: 'resulting in a mint for a new token with a significantly higher price than the known price',
  losing_assets: 'resulting in a loss of assets without any compensation',
  losing_trade: 'resulting in a losing trade',
  drainer_contract: 'to a known drainer contract',
  user_mistake: 'resulting in a loss of assets due to an innocent mistake',
  gas_farming_attack: 'resulting in a waste of the account address’ gas to generate tokens for a scammer',
  other: 'resulting in a malicious outcome',
}
export const CONTRACT_CHANGE_TITLES_MAPPING: Record<
  ProxyUpgradeManagement['type'] | OwnershipChangeManagement['type'] | ModulesChangeManagement['type'],
  string
> = {
  PROXY_UPGRADE: 'This transaction will change the mastercopy of the Safe',
  OWNERSHIP_CHANGE: 'This transaction will change the ownership of the Safe',
  MODULES_CHANGE: 'This transaction contains a Safe modules change',
}