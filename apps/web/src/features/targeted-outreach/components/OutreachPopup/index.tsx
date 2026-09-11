import {
  useTargetedMessagingGetSubmissionV1Query,
  useTargetedMessagingCreateSubmissionV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'
import { useEffect, type ReactElement } from 'react'
import { XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { useAppDispatch, useAppSelector } from '@/store'
import css from './styles.module.css'
import { closeOutreachBanner, openOutreachBanner, selectOutreachBanner } from '@/store/popupSlice'
import useLocalStorage, { useSessionStorage } from '@/services/local-storage/useLocalStorage'
import useShowOutreachPopup from '../../hooks/useShowOutreachPopup'
import { ACTIVE_OUTREACH, OUTREACH_LS_KEY, OUTREACH_SS_KEY } from '@/features/targeted-outreach/constants'
import Track from '@/components/common/Track'
import { OUTREACH_EVENTS } from '@/services/analytics/events/outreach'
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
    <div className={css.popup}>
      <div className={css.container}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <Avatar size="sm">
              <AvatarImage src="/images/common/outreach-popup-avatar.png" alt="Product marketing lead avatar" />
              <AvatarFallback>DP</AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <Typography variant="paragraph-small">Danilo Pereira</Typography>
              <Typography variant="paragraph-small" color="muted">
                Product Marketing Lead
              </Typography>
            </div>
          </div>
          <Typography variant="h4">
            Your voice matters!
            <br />
            Help us improve {'Safe{Wallet}'}.
          </Typography>
          <Typography>
            In 1 minute, tell us why you use {'Safe{Wallet}'}. Your input will help us create a better, smarter wallet
            experience for you!
          </Typography>
          <Track {...OUTREACH_EVENTS.OPEN_SURVEY}>
            <Button
              className="w-full"
              variant="default"
              onClick={handleOpenSurvey}
              render={<Link rel="noreferrer noopener" target="_blank" href={outreachUrl} />}
            >
              Get Involved
            </Button>
          </Track>
          <Track {...OUTREACH_EVENTS.ASK_AGAIN_LATER}>
            <Button className="w-full" variant="ghost" onClick={handleAskAgainLater}>
              Ask me later
            </Button>
          </Track>
          <Typography variant="paragraph-small" color="muted" align="center">
            It&apos;ll only take 1 minute.
          </Typography>
        </div>
        <Track {...OUTREACH_EVENTS.CLOSE_POPUP}>
          <Button
            className={css.close}
            variant="ghost"
            size="icon-sm"
            aria-label="close outreach popup"
            onClick={handleClose}
          >
            <XIcon className="size-4" />
          </Button>
        </Track>
      </div>
    </div>
  )
}
export default OutreachPopup
