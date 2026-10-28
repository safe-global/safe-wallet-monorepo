import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { getAllowlistAccountLabel } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { chainLabel } from '../../SafeAccountSelector/utils'
import { spenderDisplayName } from '../../SpendingLimitFlow/Summary/describePolicy'
import { findTokenOption, tokenOptionLabel, type TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'
import type { RecipientAllowlistFormValues } from '../types'
import { getUniqueSelectedRecipients } from './allowlistForm'

export type AllowlistTokenDisplay = { address: string; symbol: string; logoUri?: string }
export type AllowlistRecipientDisplay = { address: string; name?: string; isInAddressBook: boolean }

export const getAllowlistSafeLabel = (safe: SafeAccountOption): string =>
  getAllowlistAccountLabel(spenderDisplayName(safe), chainLabel(safe))

export const toAllowlistTokens = (
  addresses: readonly string[],
  options: readonly TokenOption[],
): AllowlistTokenDisplay[] =>
  addresses.map((address) => {
    const option = findTokenOption(options, address)
    return { address, symbol: option ? tokenOptionLabel(option) : shortenAddress(address), logoUri: option?.logoUri }
  })

/** `resolveName` returns the address-book name under the user's source setting, or `''`. */
export const toAllowlistRecipients = (
  values: RecipientAllowlistFormValues,
  resolveName: (address: string) => string,
): AllowlistRecipientDisplay[] =>
  getUniqueSelectedRecipients(values).map(({ address, name, fromAddressBook }) => {
    const bookName = resolveName(address)
    return { address, name: name || bookName || undefined, isInAddressBook: Boolean(fromAddressBook || bookName) }
  })

/** Once the policy guard sits in either slot, a new configuration waits out its delay. */
export const isAllowlistGuardEnabled = (guard?: { status: string }): boolean =>
  guard?.status === 'known' || guard?.status === 'partial'
