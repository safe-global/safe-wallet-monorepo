import { Box } from '@mui/material'
import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
<<<<<<< HEAD
import HnBannerDefault from '@/features/hypernative/components/HnBanner'
=======
import { HnBannerForSettings } from '@/features/hypernative/components/HnBanner'
>>>>>>> origin/main
import { HYPERNATIVE_SOURCE } from '@/services/analytics'

const RecoverySettings = dynamic(() => import('@/features/recovery/components/RecoverySettings'))

const SecurityLogin = () => {
  const isRecoverySupported = useIsRecoverySupported()
  const router = useRouter()

  return (
    <Box display="flex" flexDirection="column" gap={2}>
<<<<<<< HEAD
      <HnBannerDefault isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />
=======
      <HnBannerForSettings isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />
>>>>>>> origin/main

      {isRecoverySupported && router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </Box>
  )
}

export default SecurityLogin
