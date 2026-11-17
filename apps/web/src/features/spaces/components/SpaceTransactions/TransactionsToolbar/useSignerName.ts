import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'

/** A signer's address book name on any of `chainIds`, marked when it is the connected wallet. */
export const useSignerName = (address: string, chainIds: string[]): string => {
  const wallet = useWallet()
  const resolveName = useSafeNameResolver()
  const name = chainIds.map((chainId) => resolveName(address, chainId)).find(Boolean)
  if (sameAddress(address, wallet?.address)) return name ? `${name} (you)` : 'You'
  return name || shortenAddress(address)
}
