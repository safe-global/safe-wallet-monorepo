import { useState } from 'react'
import { Box } from '@mui/material'
import HnModal from './HnModal'
import HnSignupIntro from './HnSignupIntro'
import HnSignupForm from './HnSignupForm'

export type HnSignupFlowProps = {
  open: boolean
  onClose: () => void
}

const HnSignupFlow = ({ open, onClose }: HnSignupFlowProps) => {
  const [activeStep, setActiveStep] = useState(0)

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleFinish = () => {
    setActiveStep(0)
    onClose()
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <HnSignupIntro onGetStarted={handleNext} onClose={onClose} />
      case 1:
        return <HnSignupForm portalId="145395469" formId="66bf6e3e-085b-444a-87bd-4d3dcfe2d195" region="eu1" />
      default:
        return null
    }
  }

  return (
    <HnModal open={open} onClose={onClose}>
      <Box>{renderStepContent()}</Box>
    </HnModal>
  )
}

export default HnSignupFlow
