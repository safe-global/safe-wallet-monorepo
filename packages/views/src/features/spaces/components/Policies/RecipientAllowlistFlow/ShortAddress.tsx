import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Typography } from '@safe-global/views/components/ui/typography'

const ELLIPSIS = '...'

/** A muted, monospaced short address. */
const ShortAddress = ({ address }: { address: string }): ReactElement => {
  const short = shortenAddress(address)
  const ellipsisAt = short.indexOf(ELLIPSIS)

  return (
    <Typography variant="paragraph-mini" color="muted" className="font-mono leading-[normal]">
      {ellipsisAt === -1 ? (
        short
      ) : (
        <>
          {short.slice(0, ellipsisAt)}
          {/* In a mono font every dot takes a full slot, so two of the three are drawn closer */}
          <span className="tracking-[-0.25em]">{ELLIPSIS.slice(0, -1)}</span>
          {ELLIPSIS.slice(-1)}
          {short.slice(ellipsisAt + ELLIPSIS.length)}
        </>
      )}
    </Typography>
  )
}

export default ShortAddress
