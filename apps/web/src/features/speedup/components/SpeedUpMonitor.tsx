import { Alert, AlertTitle, Box, Button, SvgIcon, Typography } from '@mui/material'
import { SpeedUpModal } from '@/features/speedup/components/SpeedUpModal'
import Rocket from '@/public/images/common/rocket.svg'
import { useCounter } from '@/components/common/Notifications/useCounter'
import type { MouseEventHandler } from 'react'
import { useState } from 'react'
import type { PendingProcessingTx } from '@/store/pendingTxsSlice'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { isSmartContract } from '@/utils/wallets'
import useWallet from '@/hooks/wallets/useWallet'
import { isSpeedableTx } from '@/features/speedup/utils/IsSpeedableTx'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

type SpeedUpMonitorProps = {
  txId: string
  pendingTx: PendingProcessingTx
  modalTrigger: 'alertBox' | 'alertButton'
}

const SPEED_UP_THRESHOLD_IN_SECONDS = 15

export const SpeedUpMonitor = ({ txId, pendingTx, modalTrigger = 'alertBox' }: SpeedUpMonitorProps) => {
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
    <>
      <Box>
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
        {modalTrigger === 'alertBox' ? (
          <Alert
            severity="warning"
            icon={<SvgIcon component={Rocket} />}
            action={<Button onClick={onOpen}>{`Speed up >`}</Button>}
          >
            <AlertTitle>
              <Typography
                sx={{
                  textAlign: 'left',
                }}
              >
                Taking too long?
              </Typography>
            </AlertTitle>
            Try to speed up with better gas parameters.
          </Alert>
        ) : (
          <Button variant="outlined" size="small" sx={{ py: 0.6 }} onClick={onOpen}>
            Speed up
          </Button>
        )}
      </Box>
    </>
  )
}
