import type { ReactElement } from 'react'
import { X } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import CopyButton from '@/components/common/CopyButton'
import { Typography } from '@/components/ui/typography'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

type SecurityDrawerHeaderProps = {
  address: string
  name?: string
  onClose: () => void
}

/** Drawer header — Safe identicon, name, address (with copy) and a close button. */
const SecurityDrawerHeader = ({ address, name, onClose }: SecurityDrawerHeaderProps): ReactElement => (
  <div className="flex items-start justify-between gap-3 px-6 pt-6">
    <div className="flex min-w-0 items-center gap-3">
      <Identicon address={address} size={28} />
      <div className="min-w-0 leading-tight">
        <Typography variant="paragraph-small-bold" className="truncate leading-tight" title={name || address}>
          {name || shortenAddress(address)}
        </Typography>
        <div className="flex items-center gap-1 leading-none text-muted-foreground">
          <Typography variant="paragraph-mini" className="text-[10px] text-muted-foreground">
            {shortenAddress(address)}
          </Typography>
          <CopyButton text={address} className="!p-0.5 text-muted-foreground [&_svg]:!size-3" />
        </div>
      </div>
    </div>

    <button
      type="button"
      onClick={onClose}
      aria-label="Close security report"
      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-foreground shadow-sm transition-colors hover:bg-muted"
    >
      <X className="size-4" />
    </button>
  </div>
)

export default SecurityDrawerHeader
