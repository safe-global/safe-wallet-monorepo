import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAppDispatch } from '@/store'
import { setFormCompleted } from '@/features/hypernative/store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import HnModal from './HnModal'
import HnSignupIntro from './HnSignupIntro'
import HnSignupForm from './HnSignupForm'

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
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleFormSubmit = () => {
    dispatch(setFormCompleted({ chainId, safeAddress, completed: true }))
  }

  const getHubSpotConfig = () => {
    const config = process.env.NEXT_PUBLIC_HUBSPOT_CONFIG
    if (!config) {
      return null
    }
    try {
      return JSON.parse(config)
    } catch {
      return null
    }
  }

  const hubSpotConfig = getHubSpotConfig()

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <HnSignupIntro onGetStarted={handleNext} onClose={onClose} />
      case 1:
        if (!hubSpotConfig) {
          return (
            <Box p={4}>
              <Typography color="error">HubSpot configuration is missing or invalid.</Typography>
            </Box>
          )
        }
        return (
          <HnSignupForm
            portalId={hubSpotConfig.portalId}
            formId={hubSpotConfig.formId}
            region={hubSpotConfig.region}
            onCancel={handleBack}
            onSubmit={handleFormSubmit}
          />
        )
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
