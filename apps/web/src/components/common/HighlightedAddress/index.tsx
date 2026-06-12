import type { ReactElement } from 'react'

/**
 * Renders an address with the first and last 4 hex digits in bold,
 * optionally shortened to `0x1234...abcd` (same shape as `shortenAddress`).
 */
const HighlightedAddress = ({ address, shorten = false }: { address: string; shorten?: boolean }): ReactElement => (
  <>
    {address.slice(0, 2)}
    <b>{address.slice(2, 6)}</b>
    {shorten ? '...' : address.slice(6, -4)}
    <b>{address.slice(-4)}</b>
  </>
)

export default HighlightedAddress
