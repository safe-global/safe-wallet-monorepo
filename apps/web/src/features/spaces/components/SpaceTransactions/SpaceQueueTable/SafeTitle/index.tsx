import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@/components/common/Identicon'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import type { SpaceQueueSection } from '../../../../store/spaceQueueApi'
import ChainLogo from '../ChainLogo'

const SafeTitle = ({ section }: { section: SpaceQueueSection }): ReactElement => {
  const name = useSafeDisplayName(section.safeAddress, section.chains[0]?.chainId ?? '')
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Identicon address={section.safeAddress} size={24} />
      <span className="truncate font-medium text-foreground">{name || shortenAddress(section.safeAddress)}</span>
      <span className="flex shrink-0 -space-x-1">
        {section.chains.map(({ chainId }) => (
          <ChainLogo key={chainId} chainId={chainId} />
        ))}
      </span>
    </span>
  )
}

export default SafeTitle
