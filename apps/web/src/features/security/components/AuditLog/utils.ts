import { SettingsInfoType } from '@safe-global/store/gateway/types'

export type AuditEventMeta = {
  label: string
}

const SETTINGS_META: Record<string, AuditEventMeta> = {
  [SettingsInfoType.ADD_OWNER]: { label: 'Added signer' },
  [SettingsInfoType.REMOVE_OWNER]: { label: 'Removed signer' },
  [SettingsInfoType.SWAP_OWNER]: { label: 'Replaced signer' },
  [SettingsInfoType.CHANGE_THRESHOLD]: { label: 'Changed threshold' },
  [SettingsInfoType.CHANGE_IMPLEMENTATION]: { label: 'Upgraded contract' },
  [SettingsInfoType.ENABLE_MODULE]: { label: 'Enabled module' },
  [SettingsInfoType.DISABLE_MODULE]: { label: 'Disabled module' },
  [SettingsInfoType.SET_GUARD]: { label: 'Set guard' },
  [SettingsInfoType.DELETE_GUARD]: { label: 'Removed guard' },
  [SettingsInfoType.SET_FALLBACK_HANDLER]: { label: 'Changed fallback handler' },
}

export const getSettingsMeta = (type: string): AuditEventMeta =>
  SETTINGS_META[type] ?? { label: 'Configuration change' }
