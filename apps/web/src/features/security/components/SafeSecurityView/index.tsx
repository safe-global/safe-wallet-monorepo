import { type ReactElement, useCallback, useContext, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import useSafePageScanContext from '@/features/security/hooks/useSafePageScanContext'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsActiveMember } from '@/features/spaces'
import { TxModalContext } from '@/components/tx-flow'
import UpsertRecoveryFlow from '@/components/tx-flow/flows/UpsertRecovery'
import { AppRoutes } from '@/config/routes'
import SecurityReport from '@/features/security/components/SecurityReport'
import type { CtaOverride } from '@/features/security/components/SecurityReport/DimensionGrid'

const SafeSecurityView = (): ReactElement => {
  const { safe, safeAddress } = useSafeInfo()
  const scanContext = useSafePageScanContext()
  const isSafeOwner = useIsSafeOwner()
  const isSpaceMember = useIsActiveMember()
  const canView = isSafeOwner || isSpaceMember
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()

  const openRecoverySetup = useCallback(() => {
    setTxFlow(<UpsertRecoveryFlow />)
  }, [setTxFlow])

  const openRecoveryManage = useCallback(() => {
    router.push({
      pathname: AppRoutes.settings.security,
      query: { safe: router.query.safe },
    })
  }, [router])

  const ctaOverrides = useMemo((): Record<string, CtaOverride> | undefined => {
    if (!isSafeOwner) return undefined

    const hasModules = (scanContext?.modules ?? []).length > 0
    return {
      recovery: {
        onCtaClick: hasModules ? openRecoveryManage : openRecoverySetup,
        clearCtaLabel: 'Manage recovery',
      },
    }
  }, [isSafeOwner, scanContext?.modules, openRecoverySetup, openRecoveryManage])

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
      <SecurityReport key={`${safe.chainId}:${safeAddress}`} scanContext={scanContext} ctaOverrides={ctaOverrides} />
    </Box>
  )
}

export default SafeSecurityView
