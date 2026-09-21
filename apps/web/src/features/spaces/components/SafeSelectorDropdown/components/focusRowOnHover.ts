import type { MouseEvent } from 'react'

/**
 * base-ui's Select keeps DOM focus (and the grey `focus:bg-muted` highlight) on the last-hovered
 * SelectItem while the pointer stays inside the popup — it only releases the highlight when the
 * pointer leaves the popup entirely. Rows that aren't SelectItems (multi-chain summary triggers,
 * manual-sort rows) can't take that highlight away on hover, so it sticks on the previous network
 * row. Focusing the row on hover mirrors base-ui's own focus-follows-pointer model, so the highlight
 * moves with the pointer instead of getting stuck.
 */
export const focusRowOnHover = (event: MouseEvent<HTMLElement>) => {
  event.currentTarget.focus({ preventScroll: true })
}
