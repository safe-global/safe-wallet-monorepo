import { type ReactElement } from 'react'
import { Box, Typography } from '@mui/material'
import useSafePageScanContext from '@/features/security/hooks/useSafePageScanContext'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsActiveMember } from '@/features/spaces'
import SecurityReport from '@/features/security/components/SecurityReport'

const SafeSecurityView = (): ReactElement => {
  const { safe, safeAddress } = useSafeInfo()
  const scanContext = useSafePageScanContext()
  const isSafeOwner = useIsSafeOwner()
  const isSpaceMember = useIsActiveMember()
  const canView = isSafeOwner || isSpaceMember

  if (!canView) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700} mb={1}>
          Access restricted
        </Typography>
        <Typography variant="body2" color="primary.light">
          Only signers of this Safe or members of the associated Space can view security checks.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <SecurityReport key={`${safe.chainId}:${safeAddress}`} scanContext={scanContext} />
    </Box>
  )
}

export default SafeSecurityView
