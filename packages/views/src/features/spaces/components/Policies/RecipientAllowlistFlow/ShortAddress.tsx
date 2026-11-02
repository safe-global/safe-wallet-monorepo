import type { ReactElement } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'

const VISIBLE_CHARS = 4

/** A muted, monospaced short address, cut like `shortenAddress`. */
const ShortAddress = ({ address }: { address: string }): ReactElement | null => {
  if (!address) return null

  return (
    <Typography variant="paragraph-mini" color="muted" className="font-mono leading-[normal]">
      {address.slice(0, VISIBLE_CHARS + 2)}
      {/* In a mono font every dot takes a full slot, so two of the three are drawn closer */}
      <span className="tracking-[-0.25em]">..</span>.{address.slice(-VISIBLE_CHARS)}
    </Typography>
  )
}

export default ShortAddress
