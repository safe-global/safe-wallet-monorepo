import { useMemo } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Stack, Box } from '@mui/material'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import FieldsGrid from '../../FieldsGrid'
import { getNewSafeSetup } from './get-new-safe-setup'
import type { TransactionInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { ChangeSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/ChangeSignerSetupWarning'

export function ManageSigners({
  txInfo,
  txData,
}: {
  txInfo: TransactionInfo
  txData: TransactionDetails['txData']
}): ReactElement {
  const { safe } = useSafeInfo()
  const { newOwners, newThreshold } = useMemo(() => {
    return getNewSafeSetup({
      txInfo,
      txData,
      safe,
    })
  }, [txInfo, txData, safe])

  return (
    <Stack display="flex" flexDirection="column" gap={3} sx={{ '& .MuiGrid-container': { alignItems: 'flex-start' } }}>
      <ChangeSignerSetupWarning />

      <Signers owners={newOwners} />

      <Threshold owners={newOwners} threshold={newThreshold} />
    </Stack>
  )
}

function Signers({ owners }: { owners: Array<string> }): ReactElement {
  return (
    <FieldsGrid title="Signers">
      <Box display="flex" flexDirection="column" gap={2} fontSize="14px">
        {owners.map((owner) => (
          <EthHashInfo
            avatarSize={32}
            key={owner}
            showName
            address={owner}
            shortAddress={false}
            showCopyButton
            hasExplorer
          />
        ))}
      </Box>
    </FieldsGrid>
  )
}

function Threshold({ owners, threshold }: { owners: Array<string>; threshold: number }): ReactElement {
  return (
    <FieldsGrid title="Threshold">
      <Box
        component="span"
        sx={{
          // sx must be used as component is set
          backgroundColor: 'background.main',
          py: 0.5,
          px: 1,
          borderRadius: ({ shape }) => `${shape.borderRadius}px`,
          fontWeight: 700,
        }}
      >
        {threshold} of {owners.length} signer{maybePlural(owners)}
      </Box>{' '}
      required to confirm new transactions
    </FieldsGrid>
  )
}
