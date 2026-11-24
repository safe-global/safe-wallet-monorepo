import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'

/** Resolves a signer's address book name on any of `chainIds`, marked when it is the connected wallet */
export const useSignerNameResolver = (chainIds: string[]): ((address: string) => string) => {
  const wallet = useWallet()
  const resolveName = useSafeNameResolver()

  return (address) => {
    const name = chainIds.map((chainId) => resolveName(address, chainId)).find(Boolean)
    if (sameAddress(address, wallet?.address)) {
      return name ? `${name} (you)` : 'You'
    }
    return name || shortenAddress(address)
  }
}
