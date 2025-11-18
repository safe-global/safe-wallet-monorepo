import { Box } from '@mui/material'
import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import { HnBannerForSettings } from '@/features/hypernative/components/HnBanner'
import { HYPERNATIVE_SOURCE } from '@/services/analytics'

const RecoverySettings = dynamic(() => import('@/features/recovery/components/RecoverySettings'))

const SecurityLogin = () => {
  const isRecoverySupported = useIsRecoverySupported()
  const router = useRouter()

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <HnBannerForSettings isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />

      {isRecoverySupported && router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </Box>
  )
}

export default SecurityLogin
