import { shortenAddress } from '@safe-global/utils/utils/formatters'

/**
 * Open delay for the row/trigger tooltips (copy, explorer, rename, name, address). The tooltips open
 * only after a deliberate hover so a pointer passing through doesn't flash them.
 */
export const TOOLTIP_DELAY_MS = 400

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Names truncate via CSS (`truncate`) to the space actually available; the full name shows in a tooltip.
export const getSafeDisplayInfo = (name: string, address: string): { shortAddress: string; displayName: string } => {
  const shortAddress = shortenAddress(address)
  const displayName = name || shortAddress
  return { shortAddress, displayName }
}
