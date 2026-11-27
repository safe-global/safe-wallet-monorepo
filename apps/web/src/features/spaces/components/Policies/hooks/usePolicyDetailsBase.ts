import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import { flattenSafeItems } from '@/hooks/safes'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import useWallet from '@/hooks/wallets/useWallet'
import { useSpaceSafes } from '../../../hooks/useSpaceSafes'

export type PolicyDetailsBase = {
  viewer: { address?: string; isSigner: boolean }
  safe: { address: string; name?: string }
  names: Record<string, string>
  onConnectWallet: () => void
}

/** Ownership comes from the Space's own safes, already loaded, so opening a panel costs no request. */
export const usePolicyDetailsBase = (
  { chainId, address: safeAddress }: { chainId: string; address: string },
  namedAddresses: string[],
): PolicyDetailsBase => {
  const addressBook = useMergedAddressBooks(chainId)
  const wallet = useWallet()
  const onConnectWallet = useConnectWallet()
  const { allSafes } = useSpaceSafes()

  const isSigner = useMemo(
    () =>
      flattenSafeItems(allSafes).some(
        (item) => item.chainId === chainId && sameAddress(item.address, safeAddress) && !item.isReadOnly,
      ),
    [allSafes, chainId, safeAddress],
  )

  // Counterparties are named from the Space book alone, so every member reads the same policy; the
  // Safe's own name stays merged, to match the row.
  const names = useMemo(() => {
    const named: Array<[string, string]> = []

    for (const address of namedAddresses) {
      const name = addressBook.getFromSpace(address, chainId)?.name
      if (name) named.push([address, name])
    }

    return Object.fromEntries(named)
  }, [namedAddresses, addressBook, chainId])

  return {
    viewer: { address: wallet?.address, isSigner },
    safe: { address: safeAddress, name: addressBook.get(safeAddress, chainId)?.name },
    names,
    onConnectWallet,
  }
}
