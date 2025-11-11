import { Box } from '@mui/material'
import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import { useBannerVisibility } from '@/features/hypernative/hooks'
import { BannerType } from '@/features/hypernative/hooks/useBannerStorage'
import { HnBannerForCarousel } from '@/features/hypernative/components/HnBanner'

const RecoverySettings = dynamic(() => import('@/features/recovery/components/RecoverySettings'))

const SecurityLogin = () => {
  const isRecoverySupported = useIsRecoverySupported()
  const router = useRouter()
  const { showBanner: showHnBanner, loading: hnLoading } = useBannerVisibility(BannerType.Promo)

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {(showHnBanner || hnLoading) && <HnBannerForCarousel onDismiss={() => {}} />}

      {isRecoverySupported && router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </Box>
  )
}

export default SecurityLogin
