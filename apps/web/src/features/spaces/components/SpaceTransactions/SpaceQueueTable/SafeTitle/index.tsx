import type { ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import ChainLogos from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import useChains from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import type { SpaceQueueSection } from '../../../../hooks/useSpaceQueue'

const SafeTitle = ({ section }: { section: SpaceQueueSection }): ReactElement => {
  const name = useSafeDisplayName(section.safeAddress, section.chains[0]?.chainId ?? '')
  const { configs } = useChains()
  const chains = section.chains.flatMap(({ chainId }) => configs.find((chain) => chain.chainId === chainId) ?? [])
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Identicon address={section.safeAddress} size={24} />
      <span className="truncate font-medium text-foreground">{name || shortenAddress(section.safeAddress)}</span>
      <ChainLogos chains={chains} size="sm" />
    </span>
  )
}

export default SafeTitle
