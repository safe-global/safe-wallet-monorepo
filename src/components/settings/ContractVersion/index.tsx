import { useMemo } from 'react'
import { Box, Link, Typography } from '@mui/material'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import { ImplementationVersionState } from '@gnosis.pm/safe-react-gateway-sdk'
import { LATEST_SAFE_VERSION } from '@/config/constants'
import { sameAddress } from '@/utils/addresses'
import type { MasterCopy } from '@/hooks/useMasterCopies'
import { MasterCopyDeployer, useMasterCopies } from '@/hooks/useMasterCopies'
import useSafeInfo from '@/hooks/useSafeInfo'

import UpdateSafeDialog from './UpdateSafeDialog'

export const ContractVersion = ({ isGranted }: { isGranted: boolean }) => {
  const [masterCopies] = useMasterCopies()
  const { safe } = useSafeInfo()
  const masterCopyAddress = safe.implementation.value

  const safeMasterCopy: MasterCopy | undefined = useMemo(() => {
    return masterCopies?.find((mc) => sameAddress(mc.address, masterCopyAddress))
  }, [masterCopies, masterCopyAddress])

  const needsUpdate = safe.implementationVersionState === ImplementationVersionState.OUTDATED
  const latestMasterContractVersion = LATEST_SAFE_VERSION
  const showUpdateDialog = safeMasterCopy?.deployer === MasterCopyDeployer.GNOSIS && needsUpdate

  const getSafeVersionUpdate = () => {
    return showUpdateDialog ? ` (there's a newer version: ${latestMasterContractVersion})` : ''
  }

  return (
    <div>
      <Typography variant="h4" fontWeight={700} marginBottom={1}>
        Contract version
      </Typography>

      <Link rel="noreferrer noopener" href={safeMasterCopy?.deployerRepoUrl} target="_blank">
        <Box display="flex" alignItems="center" gap={0.2}>
          {safe.version}
          {getSafeVersionUpdate()}
          <OpenInNewRounded fontSize="small" />
        </Box>
      </Link>

      {showUpdateDialog && isGranted && <UpdateSafeDialog />}
    </div>
  )
}
