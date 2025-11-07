import { useState } from 'react'
import { Box, Stepper, Step, StepLabel } from '@mui/material'
import HnModal from './HnModal'
import HnSignupIntro from './HnSignupIntro'

export type HnSignupFlowProps = {
  open: boolean
  onClose: () => void
}

const steps = ['Introduction', 'Configuration', 'Confirmation']

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
        return (
          <Box p={4}>
            <div>Step 2: Configuration (Coming soon)</div>
            <button onClick={handleBack}>Back</button>
            <button onClick={handleNext}>Next</button>
          </Box>
        )
      case 2:
        return (
          <Box p={4}>
            <div>Step 3: Confirmation (Coming soon)</div>
            <button onClick={handleBack}>Back</button>
            <button onClick={handleFinish}>Finish</button>
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <HnModal open={open} onClose={onClose}>
      <Box>
        {activeStep > 0 && (
          <Box sx={{ px: 4, pt: 7, pb: 2 }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
        {renderStepContent()}
      </Box>
    </HnModal>
  )
}

export default HnSignupFlow
