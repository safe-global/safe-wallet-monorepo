import {
  useTargetedMessagingGetSubmissionV1Query,
  useTargetedMessagingCreateSubmissionV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'
import { useEffect, type ReactElement } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { closeOutreachBanner, openOutreachBanner, selectOutreachBanner } from '@/store/popupSlice'
import useLocalStorage, { useSessionStorage } from '@/services/local-storage/useLocalStorage'
import useShowOutreachPopup from '../../hooks/useShowOutreachPopup'
import { ACTIVE_OUTREACH, OUTREACH_LS_KEY, OUTREACH_SS_KEY } from '@/features/targeted-outreach/constants'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { OutreachPopupView } from '@views/features/targeted-outreach/components/OutreachPopup/OutreachPopupView'

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
    <OutreachPopupView
      outreachUrl={outreachUrl}
      onOpenSurvey={handleOpenSurvey}
      onAskAgainLater={handleAskAgainLater}
      onClose={handleClose}
    />
  )
}
export default OutreachPopup
