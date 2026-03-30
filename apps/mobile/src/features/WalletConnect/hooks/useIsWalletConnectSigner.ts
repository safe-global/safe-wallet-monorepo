import { useAppSelector } from '@/src/store/hooks'
import { selectSignerByAddress } from '@/src/store/signersSlice'

/**
 * Returns true if the signer is a WalletConnect signer.
 */
export function useIsWalletConnectSigner(address: string): boolean {
  const signer = useAppSelector((state) => selectSignerByAddress(state, address))

  return signer?.type === 'walletconnect'
}
