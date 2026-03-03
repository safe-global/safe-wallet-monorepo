import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { useContext, useMemo } from 'react'
import { SvgIcon, Typography, Alert, AlertTitle, Skeleton, Button } from '@mui/material'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { MasterCopy } from '@/hooks/useMasterCopies'
import { MasterCopyDeployer, useMasterCopies } from '@/hooks/useMasterCopies'
import useSafeInfo from '@/hooks/useSafeInfo'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TxModalContext } from '@/components/tx-flow'
import { UpdateSafeFlow } from '@/components/tx-flow/flows'
import ExternalLink from '@/components/common/ExternalLink'
import CheckWallet from '@/components/common/CheckWallet'
import { useCurrentChain } from '@/hooks/useChains'
import { UnsupportedMastercopyWarning } from '@/features/multichain'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { Box } from '@/components/common/Mui'

/**
 * Generates a GitHub release URL for a specific Safe contract version.
 * Strips L2 suffix if present (e.g., "1.3.0+L2" → "v1.3.0").
 * @param version - The Safe contract version (e.g., "1.4.1" or "1.3.0+L2")
 * @returns GitHub release URL (e.g., "https://github.com/safe-fndn/safe-smart-account/releases/tag/v1.4.1")
 */
const getReleaseUrl = (version: string): string => {
  const cleanVersion = version.split('+')[0]
  return `https://github.com/safe-fndn/safe-smart-account/releases/tag/v${cleanVersion}`
}

export const ContractVersion = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const [masterCopies] = useMasterCopies()
  const { safe, safeLoaded } = useSafeInfo()
  const currentChain = useCurrentChain()
  const masterCopyAddress = safe.implementation.value

  const safeMasterCopy: MasterCopy | undefined = useMemo(() => {
    return masterCopies?.find((mc) => sameAddress(mc.address, masterCopyAddress))
  }, [masterCopies, masterCopyAddress])

  const needsUpdate = safe.implementationVersionState === ImplementationVersionState.OUTDATED
  const showUpdateDialog = safeMasterCopy?.deployer === MasterCopyDeployer.GNOSIS && needsUpdate
  const isLatestVersion = safe.version && !showUpdateDialog

  const latestSafeVersion = getLatestSafeVersion(currentChain)

  const releaseUrl = safe.version ? getReleaseUrl(safe.version) : undefined

  return (
    <>
      <Typography variant="h4" fontWeight={700} marginBottom={1}>
        Contract version
      </Typography>

      <Typography variant="body1" fontWeight={400} display="flex" alignItems="center">
        {safeLoaded ? (
          <>
            {safe.version ?? 'Unsupported contract'}
            {isLatestVersion && (
              <>
                <CheckCircleIcon color="primary" sx={{ ml: 1, mr: 0.5 }} /> Latest version
              </>
            )}
          </>
        ) : (
          <Skeleton width="60px" />
        )}
      </Typography>

      {safeLoaded && releaseUrl && (
        <Typography variant="body2" mt={0.5}>
          <ExternalLink href={releaseUrl}>View release</ExternalLink>
        </Typography>
      )}

      <Box mt={2}>
        {safeLoaded && safe.version && showUpdateDialog ? (
          <Alert
            sx={{ borderRadius: '2px', borderColor: '#B0FFC9' }}
            icon={<SvgIcon component={InfoIcon} inheritViewBox color="secondary" />}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>
              New version is available: {latestSafeVersion} (
              <ExternalLink href={safeMasterCopy?.deployerRepoUrl}>changelog</ExternalLink>)
            </AlertTitle>

            <Typography mb={2}>
              Update now to take advantage of new features and the highest security standards available. You will need
              to confirm this update just like any other transaction.
            </Typography>

            <CheckWallet>
              {(isOk) => (
                <Button onClick={() => setTxFlow(<UpdateSafeFlow />)} variant="contained" disabled={!isOk}>
                  Update
                </Button>
              )}
            </CheckWallet>
          </Alert>
        ) : (
          <UnsupportedMastercopyWarning />
        )}
      </Box>
    </>
  )
}
