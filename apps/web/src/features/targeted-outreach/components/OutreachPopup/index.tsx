import {
  useTargetedMessagingGetSubmissionV1Query,
  useTargetedMessagingCreateSubmissionV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'
import { useEffect, type ReactElement } from 'react'
import { Avatar, Box, Button, IconButton, Link, Paper, Stack, ThemeProvider, Typography } from '@mui/material'
import { Close } from '@mui/icons-material'
import type { Theme } from '@mui/material/styles'
import { useAppDispatch, useAppSelector } from '@/store'
import css from './styles.module.css'
import { closeOutreachBanner, openOutreachBanner, selectOutreachBanner } from '@/store/popupSlice'
import useLocalStorage, { useSessionStorage } from '@/services/local-storage/useLocalStorage'
import useShowOutreachPopup from '../../hooks/useShowOutreachPopup'
import { ACTIVE_OUTREACH, OUTREACH_LS_KEY, OUTREACH_SS_KEY } from '@/features/targeted-outreach/constants'
import Track from '@/components/common/Track'
import { OUTREACH_EVENTS } from '@/services/analytics/events/outreach'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'

const OutreachPopup = (): ReactElement | null => {
  const dispatch = useAppDispatch()
  const outreachPopup = useAppSelector(selectOutreachBanner)
  const [isClosed, setIsClosed] = useLocalStorage<boolean>(`${OUTREACH_LS_KEY}_v${ACTIVE_OUTREACH.id}`)
  const currentChainId = useChainId()
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const [createSubmission] = useTargetedMessagingCreateSubmissionV1Mutation()
  const { data: submission } = useTargetedMessagingGetSubmissionV1Query(
    {
      outreachId: ACTIVE_OUTREACH.id,
      chainId: currentChainId,
      safeAddress,
      signerAddress: wallet?.address || '',
    },
    {
      skip: !wallet?.address || !safeAddress,
    },
  )

  const outreachUrl = `${ACTIVE_OUTREACH.url}#safe_address=${safeAddress}&signer_address=${wallet?.address}&chain_id=${currentChainId}`

  const [askAgainLaterTimestamp, setAskAgainLaterTimestamp] = useSessionStorage<number>(
    `${OUTREACH_SS_KEY}_v${ACTIVE_OUTREACH.id}`,
  )

  const shouldOpen = useShowOutreachPopup(isClosed, askAgainLaterTimestamp, submission)

  const handleClose = () => {
    setIsClosed(true)
    dispatch(closeOutreachBanner())
  }

  const handleAskAgainLater = () => {
    setAskAgainLaterTimestamp(Date.now())
    dispatch(closeOutreachBanner())
  }

  // Decide whether to show the popup.
  useEffect(() => {
    if (shouldOpen) {
      dispatch(openOutreachBanner())
    } else {
      dispatch(closeOutreachBanner())
    }
  }, [dispatch, shouldOpen])

  if (!outreachPopup.open) return null

  const handleOpenSurvey = async () => {
    if (wallet) {
      await createSubmission({
        outreachId: ACTIVE_OUTREACH.id,
        chainId: currentChainId,
        safeAddress,
        signerAddress: wallet.address,
        createSubmissionDto: { completed: true },
      })
    }
    dispatch(closeOutreachBanner())
  }

  return (
    // Enforce light theme for the popup
    <SafeThemeProvider mode="light">
      {(safeTheme: Theme) => (
        <ThemeProvider theme={safeTheme}>
          <Box className={css.popup}>
            <Paper className={css.container}>
              <Stack gap={2}>
                <Box display="flex" alignItems="center">
                  <Avatar
                    alt="Product marketing lead avatar"
                    src="/images/common/outreach-popup-avatar.png"
                    className={css.avatar}
                  />
                  <Box ml={1}>
                    <Typography variant="body2">Danilo Pereira</Typography>
                    <Typography variant="body2" color="primary.light">
                      Product Marketing Lead
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  Your voice matters!
                  <br />
                  Help us improve {'Safe{Wallet}'}.
                </Typography>
                <Typography>
                  In 1 minute, tell us why you use {'Safe{Wallet}'}. Your input will help us create a better, smarter
                  wallet experience for you!
                </Typography>
                <Track {...OUTREACH_EVENTS.OPEN_SURVEY}>
                  <Link rel="noreferrer noopener" target="_blank" href={outreachUrl}>
                    <Button fullWidth variant="contained" onClick={handleOpenSurvey}>
                      Get Involved
                    </Button>
                  </Link>
                </Track>
                <Track {...OUTREACH_EVENTS.ASK_AGAIN_LATER}>
                  <Button fullWidth variant="text" onClick={handleAskAgainLater}>
                    Ask me later
                  </Button>
                </Track>
                <Typography variant="body2" color="primary.light" mx="auto">
                  It&apos;ll only take 1 minute.
                </Typography>
              </Stack>
              <Track {...OUTREACH_EVENTS.CLOSE_POPUP}>
                <IconButton className={css.close} aria-label="close outreach popup" onClick={handleClose}>
                  <Close />
                </IconButton>
              </Track>
            </Paper>
          </Box>
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  )
}
export default OutreachPopup
