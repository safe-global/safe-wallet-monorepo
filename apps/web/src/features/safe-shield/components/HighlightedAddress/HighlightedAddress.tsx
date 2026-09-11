interface HighlightedAddressProps {
  address: string
  /** Number of hex chars (after `0x`) to bold at the front. */
  prefixLen: number
  /** Number of hex chars to bold at the back. */
  suffixLen: number
}

/**
 * Renders an address with its matching front/back characters bolded (hex-char counts after `0x`,
 * from getCommonAffixLengths). Front and back never overlap.
 */
export const HighlightedAddress = ({ address, prefixLen, suffixLen }: HighlightedAddressProps) => {
  const has0x = address.toLowerCase().startsWith('0x')
  const prefix = has0x ? address.slice(0, 2) : ''
  const hex = has0x ? address.slice(2) : address

  const head = Math.max(0, Math.min(prefixLen, hex.length))
  const tail = Math.max(0, Math.min(suffixLen, hex.length - head))

  return (
    <span className="break-all">
      {prefix}
      {head > 0 && <b className="font-bold">{hex.slice(0, head)}</b>}
      {hex.slice(head, hex.length - tail)}
      {tail > 0 && <b className="font-bold">{hex.slice(hex.length - tail)}</b>}
    </span>
  )
}
