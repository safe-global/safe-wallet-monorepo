import { type ReactElement, type SyntheticEvent, useCallback, useContext, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import useSafePageScanContext from '@/features/security/hooks/useSafePageScanContext'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsActiveMember, useSpaceSafes } from '@/features/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useLoadFeature } from '@/features/__core__'
import { HypernativeFeature } from '@/features/hypernative'
import { TxModalContext } from '@/components/tx-flow'
import UpsertRecoveryFlow from '@/components/tx-flow/flows/UpsertRecovery'
import { AppRoutes } from '@/config/routes'
import SecurityReport from '@/features/security/components/SecurityReport'
import AuditLog from '@/features/security/components/AuditLog'
import SecurityTabs from '@/features/security/components/SecurityTabs'
import type { CardOverride } from '@/features/security/components/SecurityReport/DimensionGrid'
import type { ScanResult } from '@/features/security/data/scanners/types'

const SafeSecurityView = (): ReactElement => {
  const scanContext = useSafePageScanContext()
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const { allSafes } = useSpaceSafes()
  const isSpaceMember = useIsActiveMember()
  const isSafeInSpace = isSpaceMember && allSafes.some((s) => sameAddress(s.address, safe.address.value))
  const canView = isSafeOwner || isSafeInSpace
  const { setTxFlow } = useContext(TxModalContext)
  const router = useRouter()
  const [signupOpen, setSignupOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
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

  const handleTabChange = useCallback((_: SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }, [])

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

  const safeKey = safeQueryParam ?? 'loading'

  return (
    <Box>
      <SecurityTabs value={activeTab} onChange={handleTabChange} />

      {activeTab === 0 && (
        <SecurityReport key={safeKey} scanContext={scanContext} buildCardOverrides={buildCardOverrides} />
      )}

      {activeTab === 1 && <AuditLog chainId={safe.chainId} safeAddress={safe.address.value} />}

      <HnSignupFlow open={signupOpen} onClose={closeSignup} />
    </Box>
  )
}

export default SafeSecurityView
