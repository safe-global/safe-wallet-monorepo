import { useSigner } from '@/hooks/wallets/useWallet'
import { isSafeSigner } from '@/utils/wallets'

/** The signer's address when the signer is itself a Safe, in the app or over WalletConnect; otherwise undefined */
const useSafeSignerAddress = (): string | undefined => {
  const signer = useSigner()
  return signer && isSafeSigner(signer) ? signer.address : undefined
}

export default useSafeSignerAddress
