import useAsync from '@safe-global/utils/hooks/useAsync'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { isSmartContractWallet } from '@/utils/wallets'
import { Errors, logError } from '@/services/exceptions'
import { type SafeTransaction } from '@safe-global/types-kit'

const useWalletCanRelay = (tx: SafeTransaction | undefined) => {
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const hasEnoughSignatures = tx && tx.signatures.size >= safe.threshold

  return useAsync(() => {
    if (!tx || !wallet) return

    return isSmartContractWallet(wallet.chainId, wallet.address)
      .then((isSCWallet) => {
        if (!isSCWallet) return true

        return hasEnoughSignatures
      })
      .catch((err) => {
        logError(Errors._106, err.message)
        return false
      })
  }, [hasEnoughSignatures, tx, wallet])
}

export default useWalletCanRelay
