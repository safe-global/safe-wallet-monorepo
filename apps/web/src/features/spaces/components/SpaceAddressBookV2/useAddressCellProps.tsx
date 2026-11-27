import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import Identicon from '@safe-global/views/components/common/Identicon'
import { CONTACT_AVATAR_SIZE } from '@safe-global/views/features/spaces/components/AddressBookV2/ContactCell'
import { useCurrentChain } from '@/hooks/useChains'

const renderAvatar = (address: string) => <Identicon address={address} size={CONTACT_AVATAR_SIZE} />

const useAddressCellProps = () => {
  const chain = useCurrentChain()

  return {
    renderAvatar,
    getExplorerLink: chain ? (address: string) => getBlockExplorerLink(chain, address) : undefined,
  }
}

export default useAddressCellProps
