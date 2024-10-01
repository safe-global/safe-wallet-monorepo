import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Divider, Paper, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'

import Track from '@/components/common/Track'
import { CREATE_SAFE_EVENTS } from '@/services/analytics/events/createLoadSafe'
import StatusMessage from '@/components/new-safe/create/steps/StatusStep/StatusMessage'
import useWallet from '@/hooks/wallets/useWallet'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import type { NewSafeFormData } from '@/components/new-safe/create'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import useSafeCreationEffects from '@/components/new-safe/create/steps/StatusStep/useSafeCreationEffects'
import { SafeCreationStatus, useSafeCreation } from '@/components/new-safe/create/steps/StatusStep/useSafeCreation'
import StatusStepper from '@/components/new-safe/create/steps/StatusStep/StatusStepper'
import { OPEN_SAFE_LABELS, OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { getRedirect } from '@/components/new-safe/create/logic'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import { AppRoutes } from '@/config/routes'
import lightPalette from '@/components/theme/lightPalette'
import { useCurrentChain } from '@/hooks/useChains'
import { usePendingSafe } from './usePendingSafe'
import useSyncSafeCreationStep from '../../useSyncSafeCreationStep'

export const getInitialCreationStatus = (willRelay: boolean): SafeCreationStatus =>
  willRelay ? SafeCreationStatus.PROCESSING : SafeCreationStatus.AWAITING

export const CreateSafeStatus = ({ data, setProgressColor, setStep }: StepRenderProps<NewSafeFormData>) => {
  const router = useRouter()
  const chainInfo = useCurrentChain()
  const chainPrefix = chainInfo?.shortName || ''
  const wallet = useWallet()
  const isWrongChain = useIsWrongChain()
  const isConnected = wallet && !isWrongChain
  const [pendingSafe, setPendingSafe] = usePendingSafe()
  useSyncSafeCreationStep(setStep)

  // The willRelay flag can come from the previous step or from local storage
  const willRelay = !!(data.willRelay || pendingSafe?.willRelay)
  const initialStatus = getInitialCreationStatus(willRelay)
  const [status, setStatus] = useState<SafeCreationStatus>(initialStatus)

  const { handleCreateSafe } = useSafeCreation(status, setStatus, willRelay)

  useSafeCreationEffects({
    status,
    setStatus,
  })

  const onClose = useCallback(() => {
    setPendingSafe(undefined)

    router.push(AppRoutes.welcome.index)
  }, [router, setPendingSafe])

  const handleRetry = useCallback(() => {
    setStatus(initialStatus)
    void handleCreateSafe()
  }, [handleCreateSafe, initialStatus])

  const onFinish = useCallback(() => {
    trackEvent(CREATE_SAFE_EVENTS.GET_STARTED)

    const { safeAddress } = pendingSafe || {}

    if (safeAddress) {
      setPendingSafe(undefined)
      router.push(getRedirect(chainPrefix, safeAddress, router.query?.safeViewRedirectURL))
    }
  }, [chainPrefix, pendingSafe, router, setPendingSafe])

  const onStartNow = useCallback(() => {
    const { safeAddress } = pendingSafe || {}
    if (safeAddress) {
      router.push(getRedirect(chainPrefix, safeAddress, router.query?.safeViewRedirectURL))
    }
  }, [chainPrefix, pendingSafe, router])

  const displaySafeLink = status >= SafeCreationStatus.INDEXED
  const isError = status >= SafeCreationStatus.WALLET_REJECTED && status <= SafeCreationStatus.TIMEOUT

  useEffect(() => {
    if (!setProgressColor) return

    if (isError) {
      setProgressColor(lightPalette.error.main)
    } else {
      setProgressColor(lightPalette.secondary.main)
    }
  }, [isError, setProgressColor])

  const showStartOver = status == SafeCreationStatus.SUCCESS

  return (
    <Paper
      sx={{
        textAlign: 'center',
      }}
    >
      <Box className={layoutCss.row}>
        <StatusMessage status={status} isError={isError} />
      </Box>

      {!isError && pendingSafe && (
        <>
          <Divider />
          <Box className={layoutCss.row}>
            <StatusStepper status={status} />
          </Box>
        </>
      )}

      {showStartOver && (
        <>
          <Divider />
          <Box className={layoutCss.row}>
            <Button onClick={onStartNow} color="secondary" variant="contained">
              Start now!
            </Button>
          </Box>
        </>
      )}
      {displaySafeLink && (
        <>
          <Divider />
          <Box className={layoutCss.row}>
            <Track {...OVERVIEW_EVENTS.OPEN_SAFE} label={OPEN_SAFE_LABELS.after_create}>
              <Button data-testid="start-using-safe-btn" color="secondary" variant="contained" onClick={onFinish}>
                Start using Superchain Account
              </Button>
            </Track>
          </Box>
        </>
      )}

      {isError && (
        <>
          <Divider />
          <Box className={layoutCss.row}>
            <Box display="flex" flexDirection="row" justifyContent="space-between" gap={3}>
              <Track {...CREATE_SAFE_EVENTS.CANCEL_CREATE_SAFE}>
                <Button onClick={onClose} variant="outlined">
                  Cancel
                </Button>
              </Track>
              <Track {...CREATE_SAFE_EVENTS.RETRY_CREATE_SAFE}>
                <Tooltip
                  title={!isConnected ? 'Please make sure your wallet is connected on the correct network.' : ''}
                >
                  <Typography display="flex" height={1}>
                    <Button onClick={handleRetry} variant="contained" disabled={!isConnected}>
                      Retry
                    </Button>
                  </Typography>
                </Tooltip>
              </Track>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  )
}
