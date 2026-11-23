import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import ChainLogos from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

const SafeTitle = ({
  safeAddress,
  name,
  chains,
}: {
  safeAddress: string
  name?: string
  chains: ChainInfo[]
}): ReactElement => (
  <span className="flex min-w-0 items-center gap-3">
    <Identicon address={safeAddress} size={24} />
    <span className="truncate font-medium text-foreground">{name || shortenAddress(safeAddress)}</span>
    <ChainLogos chains={chains} />
  </span>
)

export default SafeTitle
