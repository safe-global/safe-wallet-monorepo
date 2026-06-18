import { shortenAddress } from '@safe-global/utils/utils/formatters'

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getSafeDisplayInfo = (name: string, address: string): { shortAddress: string; displayName: string } => {
  const shortAddress = shortenAddress(address)
  const displayName = name || shortAddress
  return { shortAddress, displayName }
}
