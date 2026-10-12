import { shortenAddress } from '@safe-global/utils/utils/formatters'

/**
 * Open delay for the row/trigger tooltips (copy, explorer, rename, name, address). The tooltips open
 * only after a deliberate hover so a pointer passing through doesn't flash them.
 */
export const TOOLTIP_DELAY_MS = 400

// Revealed on row hover (rows carry `group/row`) and on keyboard focus. group-focus-visible (not
// group-focus): base-ui parks focus on the last hovered option without ever clearing it, so plain
// focus would keep the actions visible after the pointer has moved on.
export const HOVER_ACTION_CLASS =
  'opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100 focus-within:opacity-100 focus-visible:opacity-100'

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
