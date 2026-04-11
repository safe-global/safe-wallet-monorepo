import { type ReactElement } from 'react'
import { Box } from '@mui/material'
import useSafePageScanContext from '@/features/security/hooks/useSafePageScanContext'
import useSafeInfo from '@/hooks/useSafeInfo'
import SecurityReport from '@/features/security/components/SecurityReport'

const SafeSecurityView = (): ReactElement => {
  const { safe, safeAddress } = useSafeInfo()
  const scanContext = useSafePageScanContext()

  return (
    <Box>
      <SecurityReport key={`${safe.chainId}:${safeAddress}`} scanContext={scanContext} />
    </Box>
  )
}

export default SafeSecurityView
