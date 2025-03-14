import { SettingsChangeTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Address } from '@/src/types/address'

// TODO: fix it in the @safe-global/store/gateway/AUTO_GENERATED types
export type NormalizedSettingsChangeTransaction = SettingsChangeTransaction & {
  settingsInfo: SettingsChangeTransaction['settingsInfo'] & {
    owner: { value: Address; name: string }
    threshold: number
  }
}
