import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAppDispatch } from '@/store'
import { setFormCompleted } from '@/features/hypernative/store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import HnModal from './HnModal'
import HnSignupIntro from './HnSignupIntro'
import HnCalendlyStep from './HnCalendlyStep'

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

  const handleClose = () => {
    // Mark form as completed in Redux when user closes after viewing Calendly
    if (activeStep === 1) {
      dispatch(setFormCompleted({ chainId, safeAddress, completed: true }))
    }
    // Reset local state
    setActiveStep(0)
    // Call parent onClose
    onClose()
  }

  const renderStepContent = () => {
    const calendlyUrl = process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY

    switch (activeStep) {
      case 0:
        return <HnSignupIntro onGetStarted={handleNext} onClose={handleClose} />
      case 1:
        if (!calendlyUrl) {
          return (
            <Box p={4}>
              <Typography color="error">Calendly configuration is missing.</Typography>
            </Box>
          )
        }
        return <HnCalendlyStep calendlyUrl={calendlyUrl} />
      default:
        return null
    }
  }

  return (
    <HnModal open={open} onClose={handleClose}>
      <Box>{renderStepContent()}</Box>
    </HnModal>
  )
}

export default HnSignupFlow
