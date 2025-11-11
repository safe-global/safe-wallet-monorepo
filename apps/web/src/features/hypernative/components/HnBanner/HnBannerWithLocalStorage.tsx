import type { ReactElement } from 'react'
import { Box } from '@mui/material'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnBanner } from './HnBanner'
import { HN_BANNER_LS_KEY } from './constants'

export interface HnBannerWithLocalStorageProps extends WithHnSignupFlowProps { }

/**
 * Wrapper component for HnBanner that doesn't require SafeInfo.
 * Uses localStorage for visibility control and dismissal instead of Redux.
 * Only renders if the localStorage value is not false.
 */
export const HnBannerWithLocalStorage = ({
  onHnSignupClick,
}: HnBannerWithLocalStorageProps): ReactElement | null => {
  const [value, setBannerVisible] = useLocalStorage<boolean>(HN_BANNER_LS_KEY)

  // Only render if value is not false (default behavior: show if undefined or true)
  if (value === false) {
    return null
  }

  const handleDismiss = () => {
    setBannerVisible(false)
  }

  return (
    <Box sx={{ mb: 2 }}>
      <HnBanner onHnSignupClick={onHnSignupClick} onDismiss={handleDismiss} />
    </Box>
  )
}
