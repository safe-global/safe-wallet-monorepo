import useAsync from '@safe-global/utils/hooks/useAsync'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import useNow from '@/hooks/useNow'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useWallet from '@/hooks/wallets/useWallet'
import { PendingStatus, type PendingTx } from '@/store/pendingTxsSlice'
import { isSmartContract } from '@/utils/wallets'
import { isSpeedableTx } from '../../services/isSpeedableTx'

export const SPEED_UP_THRESHOLD_IN_SECONDS = 15

/**
 * Whether the connected wallet can speed up this pending transaction: it submitted it from an EOA and it has been
 * processing for a while, so its network fee may be too low. False while the chain has speed up off.
 */
const useIsSpeedUpAvailable = (pendingTx: PendingTx | undefined): boolean => {
  const isFeatureEnabled = useHasFeature(FEATURES.SPEED_UP_TX)
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const processing = isFeatureEnabled && pendingTx?.status === PendingStatus.PROCESSING
  const now = useNow(processing)
  const signerAddress = processing ? pendingTx.signerAddress : undefined

  const [smartContract] = useAsync(async () => {
    if (!signerAddress || !web3ReadOnly) return false
    return isSmartContract(signerAddress)
  }, [signerAddress, web3ReadOnly])

  if (!processing || !isSpeedableTx(pendingTx, smartContract, wallet?.address ?? '')) return false

  return Math.floor((now - pendingTx.submittedAt) / 1000) >= SPEED_UP_THRESHOLD_IN_SECONDS
}

export default useIsSpeedUpAvailable
