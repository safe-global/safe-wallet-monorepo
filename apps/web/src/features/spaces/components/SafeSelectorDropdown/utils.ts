import { formatPrefixedAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const MAX_NAME_LENGTH = 20

export const truncateName = (name: string, maxLength = MAX_NAME_LENGTH): string =>
  name.length > maxLength ? `${name.slice(0, maxLength)}...` : name

export const getSafeDisplayInfo = (
  name: string,
  address: string,
  chainShortName?: string,
): { addressWithPrefix: string; displayName: string; showAddressLine: boolean } => {
  const addressWithPrefix = formatPrefixedAddress(shortenAddress(address), chainShortName || undefined)
  const displayName = name ? truncateName(name) : addressWithPrefix
  const showAddressLine = Boolean(name)
  return { addressWithPrefix, displayName, showAddressLine }
}
