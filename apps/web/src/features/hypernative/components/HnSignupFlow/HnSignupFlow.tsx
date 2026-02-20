import { useState } from 'react'
import { useAppDispatch } from '@/store'
import { setFormCompleted } from '../../store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import HnModal from './HnModal'
import HnSignupIntro from './HnSignupIntro'
import HnCalendlyStep from './HnCalendlyStep'
import { HYPERNATIVE_EVENTS, MixpanelEventParams, trackEvent } from '@/services/analytics'

export type HnSignupFlowProps = {
  open: boolean
  onClose: () => void
}

const HnSignupFlow = ({ open, onClose }: HnSignupFlowProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()

  const handleNext = () => {
    setActiveStep(1)
  }

  const handleBookingScheduled = () => {
    // Mark form as completed in Redux when a booking is actually scheduled; track events
    dispatch(setFormCompleted({ chainId, safeAddress, completed: true }))
    trackEvent(HYPERNATIVE_EVENTS.GUARDIAN_FORM_SUBMITTED, {
      [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
      [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
    })
  }

  const handleClose = () => {
    // Reset local state
    setActiveStep(0)
    // Call parent onClose
    onClose()
  }

  const renderStepContent = () => {
    const calendlyUrl = 'https://calendly.com/d/ctgh-yrs-dnr'

    switch (activeStep) {
      case 0:
        return <HnSignupIntro onGetStarted={handleNext} onClose={handleClose} />
      case 1:
        return <HnCalendlyStep calendlyUrl={calendlyUrl} onBookingScheduled={handleBookingScheduled} />
      default:
        return null
    }
  }

  return (
    <HnModal open={open} onClose={handleClose}>
      {renderStepContent()}
    </HnModal>
  )
}

export default HnSignupFlow
