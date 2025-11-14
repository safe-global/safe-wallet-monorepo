import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAppDispatch } from '@/store'
import { setFormCompleted } from '@/features/hypernative/store/hnStateSlice'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import HnModal from './HnModal'
import HnSignupIntro from './HnSignupIntro'
import HnSignupForm from './HnSignupForm'
import HnCalendlyStep from './HnCalendlyStep'

export type HnSignupFlowProps = {
  open: boolean
  onClose: () => void
}

const getCalendlyConfig = (): Record<string, string> => {
  try {
    const configString = process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY
    if (!configString) {
      console.warn('[HnSignupFlow] NEXT_PUBLIC_HYPERNATIVE_CALENDLY not configured')
      return {}
    }
    return JSON.parse(configString)
  } catch (error) {
    console.error('[HnSignupFlow] Failed to parse NEXT_PUBLIC_HYPERNATIVE_CALENDLY:', error)
    return {}
  }
}

const HnSignupFlow = ({ open, onClose }: HnSignupFlowProps) => {
  const [activeStep, setActiveStep] = useState(0)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string>('AMERICAS')
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currentChain = useCurrentChain()

  // Format safe address with chain prefix (e.g., "eth:0x1234...")
  const formattedSafeAddress =
    currentChain?.shortName && safeAddress ? `${currentChain.shortName}:${safeAddress}` : safeAddress

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleFormSubmit = (region: string) => {
    // Mark form as submitted locally, but don't update Redux yet
    setFormSubmitted(true)
    setSelectedRegion(region)
    // Move to Calendly step
    setActiveStep(2)
  }

  const handleClose = () => {
    // Only mark form as completed in Redux if it was submitted
    if (formSubmitted) {
      dispatch(setFormCompleted({ chainId, safeAddress, completed: true }))
    }
    // Reset local state
    setFormSubmitted(false)
    setActiveStep(0)
    // Call parent onClose
    onClose()
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
    const calendlyConfig = getCalendlyConfig()

    switch (activeStep) {
      case 0:
        return <HnSignupIntro onGetStarted={handleNext} onClose={handleClose} />
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
            safeAddress={formattedSafeAddress}
            onCancel={handleBack}
            onSubmit={handleFormSubmit}
          />
        )
      case 2:
        const calendlyUrl = calendlyConfig[selectedRegion] || calendlyConfig['AMERICAS']
        if (!calendlyUrl) {
          return (
            <Box p={4}>
              <Typography color="error">Calendly configuration is missing for region: {selectedRegion}</Typography>
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
