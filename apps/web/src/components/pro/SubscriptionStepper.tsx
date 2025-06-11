import React from 'react'
import { Box, Stepper, Step, StepLabel, Button, Paper } from '@mui/material'
import css from './styles.module.css'

interface SubscriptionStepperProps {
  activeStep: number
  steps: string[]
  children: React.ReactNode
  onBack?: () => void
  showBackButton?: boolean
}

const SubscriptionStepper: React.FC<SubscriptionStepperProps> = ({
  activeStep,
  steps,
  children,
  onBack,
  showBackButton = true,
}) => {
  return (
    <Box className={css.stepperContainer}>
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box className={css.stepContent}>{children}</Box>

      {showBackButton && activeStep > 0 && onBack && (
        <Box className={css.stepActions}>
          <Button variant="outlined" onClick={onBack}>
            Back
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default SubscriptionStepper
