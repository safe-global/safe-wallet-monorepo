export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const shortenAddress = (address: string): string => {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const parseSafeId = (safeId: string) => {
  const colonIndex = safeId.indexOf(':')
  const isSafeIdFormat = colonIndex > 0 && safeId.slice(colonIndex + 1).startsWith('0x')

  if (!isSafeIdFormat) return null

  return {
    chainId: safeId.slice(0, colonIndex),
    address: safeId.slice(colonIndex + 1),
  }
}
