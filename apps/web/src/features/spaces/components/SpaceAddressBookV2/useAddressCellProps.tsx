import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import Identicon from '@/components/common/Identicon'
import { useCurrentChain } from '@/hooks/useChains'

const renderAvatar = (address: string) => <Identicon address={address} size={24} />

/** The identicon and the current chain's explorer link that both tables show for each address. */
const useAddressCellProps = () => {
  const chain = useCurrentChain()

  return {
    renderAvatar,
    getExplorerLink: chain ? (address: string) => getBlockExplorerLink(chain, address) : undefined,
  }
}

export default useAddressCellProps
