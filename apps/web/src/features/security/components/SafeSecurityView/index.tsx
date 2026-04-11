import { type ReactElement, useCallback, useContext, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import useSafePageScanContext from '@/features/security/hooks/useSafePageScanContext'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsActiveMember } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'
import { HypernativeFeature } from '@/features/hypernative'
import { TxModalContext } from '@/components/tx-flow'
import UpsertRecoveryFlow from '@/components/tx-flow/flows/UpsertRecovery'
import { AppRoutes } from '@/config/routes'
import SecurityReport from '@/features/security/components/SecurityReport'
import type { CardOverride } from '@/features/security/components/SecurityReport/DimensionGrid'
import type { ScanResult } from '@/features/security/data/scanners/types'

const SafeSecurityView = (): ReactElement => {
  const scanContext = useSafePageScanContext()
  const isSafeOwner = useIsSafeOwner()
  const isSpaceMember = useIsActiveMember()
  const canView = isSafeOwner || isSpaceMember
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const [signupOpen, setSignupOpen] = useState(false)
  const { HypernativeLogo, HnSignupFlow } = useLoadFeature(HypernativeFeature)

  const querySafe = router.query.safe
  const safeQueryParam = typeof querySafe === 'string' ? querySafe : undefined

  const hasModules = (scanContext?.modules ?? []).length > 0

  const openRecoverySetup = useCallback(() => {
    setTxFlow(<UpsertRecoveryFlow />)
  }, [setTxFlow])

  const openRecoveryManage = useCallback(() => {
    router.push({
      pathname: AppRoutes.settings.security,
      query: { safe: safeQueryParam },
    })
  }, [router.push, safeQueryParam])

  const closeSignup = useCallback(() => setSignupOpen(false), [])

  const buildCardOverrides = useCallback(
    (results: Record<string, ScanResult>): Record<string, CardOverride> => {
      const overrides: Record<string, CardOverride> = {}

      if (isSafeOwner) {
        overrides.recovery = {
          onCtaClick: hasModules ? openRecoveryManage : openRecoverySetup,
          clearCtaLabel: 'Manage recovery',
        }
      }

      const guardResult = results.guard
      if (guardResult?.partner === 'hypernative') {
        overrides.guard = {
          ...overrides.guard,
          title: 'Hypernative Guardian',
          description: 'Enterprise-grade transaction guard that monitors and blocks risky transactions.',
          logo: <HypernativeLogo sx={{ fontSize: 80, height: 20 }} />,
          ctaLabel: guardResult.status === 'partial' ? 'Get Guardian' : undefined,
          onCtaClick: guardResult.status === 'partial' ? () => setSignupOpen(true) : undefined,
          clearCtaLabel: 'Manage Guardian',
        }
      }

      return overrides
    },
    [isSafeOwner, hasModules, openRecoverySetup, openRecoveryManage, HypernativeLogo],
  )

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

  // Key on URL query param — changes immediately on selection, forcing a full
  // SecurityReport remount with clean state. The staleness guards in
  // useSafePageScanContext ensure no scan fires until data matches the URL.
  const safeKey = safeQueryParam ?? 'loading'

  return (
    <Box>
      <SecurityReport key={safeKey} scanContext={scanContext} buildCardOverrides={buildCardOverrides} />
      <HnSignupFlow open={signupOpen} onClose={closeSignup} />
    </Box>
  )
}

export default SafeSecurityView
