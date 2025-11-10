import { Box } from '@mui/material'
import dynamic from 'next/dynamic'
import { useIsRecoverySupported } from '@/features/recovery/hooks/useIsRecoverySupported'
import SecuritySettings from '../SecuritySettings'
import { useRouter } from 'next/router'
import HnBanner from '@/features/hypernative/components/HnBanner'

const RecoverySettings = dynamic(() => import('@/features/recovery/components/RecoverySettings'))

const SecurityLogin = () => {
  const isRecoverySupported = useIsRecoverySupported()
  const router = useRouter()

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <HnBanner isDismissable={false} />

      {isRecoverySupported && router.query.safe ? <RecoverySettings /> : null}

      <SecuritySettings />
    </Box>
  )
}

export default SecurityLogin
