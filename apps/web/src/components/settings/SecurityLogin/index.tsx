import { Box } from '@mui/material'
import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import { useLoadFeature } from '@/features/__core__'
import { HypernativeFeature } from '@/features/hypernative'
import { HYPERNATIVE_SOURCE } from '@/services/analytics'

const RecoverySettings = dynamic(() => import('@/features/recovery/components/RecoverySettings'))

const SecurityLogin = () => {
  const isRecoverySupported = useIsRecoverySupported()
  const router = useRouter()
  const hypernative = useLoadFeature(HypernativeFeature)

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* If guard is active:
      HnActivatedBannerForSettings shows,
      HnBannerForSettings doesn't - useBannerVisibility already ensures mutual exclusivity */}
      {hypernative && (
        <>
          <hypernative.components.HnActivatedBannerForSettings />
          <hypernative.components.HnBannerForSettings isDismissable={false} label={HYPERNATIVE_SOURCE.Settings} />
        </>
      )}

      {isRecoverySupported && router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </Box>
  )
}

export default SecurityLogin
