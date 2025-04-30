import { useContext, useMemo } from 'react'
import { SvgIcon, Typography, Alert, AlertTitle, Skeleton, Button } from '@mui/material'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
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
import { UnsupportedMastercopyWarning } from '@/features/multichain/components/UnsupportedMastercopyWarning/UnsupportedMasterCopyWarning'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

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

  const latestSafeVersion = getLatestSafeVersion(currentChain, true)

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

      {safeLoaded && safe.version && showUpdateDialog ? (
        <Alert
          sx={{ mt: 2, borderRadius: '2px', borderColor: '#B0FFC9' }}
          icon={<SvgIcon component={InfoIcon} inheritViewBox color="secondary" />}
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            New version is available: {latestSafeVersion} (
            <ExternalLink href={safeMasterCopy?.deployerRepoUrl}>changelog</ExternalLink>)
          </AlertTitle>

          <Typography mb={2}>
            Update now to take advantage of new features and the highest security standards available. You will need to
            confirm this update just like any other transaction.
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
    </>
  )
}
