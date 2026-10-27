import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { getAllowlistAccountLabel } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import type { MergedAddressBook } from '@/hooks/useAllAddressBooks'
import { chainLabel } from '../../SafeAccountSelector/utils'
import { findTokenOption, tokenOptionLabel, type TokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'
import type { RecipientAllowlistFormValues } from '../types'
import { getUniqueSelectedRecipients } from './allowlistForm'

export type AllowlistTokenDisplay = { address: string; symbol: string; logoUri?: string }
export type AllowlistRecipientDisplay = { address: string; name?: string; isInAddressBook: boolean }

export const getAllowlistSafeLabel = (safe: SafeAccountOption): string =>
  getAllowlistAccountLabel(safe.name || shortenAddress(safe.address), chainLabel(safe))

export const toAllowlistTokens = (
  addresses: readonly string[],
  options: readonly TokenOption[],
): AllowlistTokenDisplay[] =>
  addresses.map((address) => {
    const option = findTokenOption(options, address)
    return { address, symbol: option ? tokenOptionLabel(option) : shortenAddress(address), logoUri: option?.logoUri }
  })

export const toAllowlistRecipients = (
  values: RecipientAllowlistFormValues,
  addressBook: Pick<MergedAddressBook, 'get' | 'has'>,
  chainId: string | undefined,
): AllowlistRecipientDisplay[] =>
  getUniqueSelectedRecipients(values).map(({ address, name, fromAddressBook }) => ({
    address,
    name: name || (chainId ? addressBook.get(address, chainId)?.name : undefined),
    isInAddressBook: Boolean(fromAddressBook) || (chainId ? addressBook.has(address, chainId) : false),
  }))

export const getAllowlistRecipientLabel = ({ name, address }: Pick<AllowlistRecipientDisplay, 'name' | 'address'>) =>
  name || shortenAddress(address)

/** Once the policy guard sits in either slot, a new configuration waits out its delay. */
export const isAllowlistGuardEnabled = (guard?: { status: string }): boolean =>
  guard?.status === 'known' || guard?.status === 'partial'
