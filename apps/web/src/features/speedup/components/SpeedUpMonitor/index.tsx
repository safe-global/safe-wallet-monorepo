import SpeedUpModal from '../SpeedUpModal'
import { useCounter } from '@/components/common/Notifications/useCounter'
import type { MouseEventHandler } from 'react'
import { useState } from 'react'
import type { PendingProcessingTx } from '@/store/pendingTxsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { isSmartContract } from '@/utils/wallets'
import useWallet from '@/hooks/wallets/useWallet'
import { isSpeedableTx } from '../../services/isSpeedableTx'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SpeedUpMonitorView } from '@views/features/speedup/components/SpeedUpMonitor/SpeedUpMonitorView'

type SpeedUpMonitorProps = {
  txId: string
  pendingTx: PendingProcessingTx
  modalTrigger: 'alertBox' | 'alertButton'
}

const SPEED_UP_THRESHOLD_IN_SECONDS = 15

const SpeedUpMonitor = ({ txId, pendingTx, modalTrigger = 'alertBox' }: SpeedUpMonitorProps) => {
  const [openSpeedUpModal, setOpenSpeedUpModal] = useState(false)
  const wallet = useWallet()
  const counter = useCounter(pendingTx.submittedAt)
  const web3ReadOnly = useWeb3ReadOnly()
  const isFeatureEnabled = useHasFeature(FEATURES.SPEED_UP_TX)

  const [smartContract] = useAsync(async () => {
    if (!pendingTx.signerAddress || !web3ReadOnly) return false
    return isSmartContract(pendingTx.signerAddress)
  }, [pendingTx.signerAddress, web3ReadOnly])

  if (!isFeatureEnabled || !isSpeedableTx(pendingTx, smartContract, wallet?.address ?? '')) {
    return null
  }

  if (!counter || counter < SPEED_UP_THRESHOLD_IN_SECONDS) {
    return null
  }

  const onOpen: MouseEventHandler = (e) => {
    e.stopPropagation()
    setOpenSpeedUpModal(true)
    trackEvent(MODALS_EVENTS.OPEN_SPEED_UP_MODAL)
  }

  return (
    <SpeedUpMonitorView
      modalTrigger={modalTrigger}
      onOpen={onOpen}
      modal={
        <SpeedUpModal
          open={openSpeedUpModal}
          handleClose={() => setOpenSpeedUpModal(false)}
          pendingTx={pendingTx}
          gasLimit={pendingTx.gasLimit}
          txId={txId}
          txHash={pendingTx.txHash!}
          signerAddress={pendingTx.signerAddress}
          signerNonce={pendingTx.signerNonce}
        />
      }
    />
  )
}

export default SpeedUpMonitor
