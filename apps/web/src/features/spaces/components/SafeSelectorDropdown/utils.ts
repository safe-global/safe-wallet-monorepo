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

export const getSafeDisplayInfo = (name: string, address: string): { shortAddress: string; displayName: string } => {
  const shortAddress = shortenAddress(address)
  const displayName = name ? truncateName(name) : shortAddress
  return { shortAddress, displayName }
}
