import { useMemo } from 'react'
import type { ReactElement } from 'react'

import MinusIcon from '@/public/images/common/minus.svg'
import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Stack, Box } from '@mui/material'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import FieldsGrid from '../../FieldsGrid'
import { getNewSafeSetup } from './get-new-safe-setup'
import type { TransactionInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { ChangeSignerSetupWarning } from '@/features/multichain/components/SignerSetupWarning/ChangeSignerSetupWarning'
import { OwnerList } from '@/components/tx-flow/common/OwnerList'

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

      <Actions newOwners={newOwners} />

      <Signers owners={newOwners} />

      <Threshold owners={newOwners} threshold={newThreshold} />
    </Stack>
  )
}

function Actions({ newOwners }: { newOwners: Array<string> }): ReactElement | null {
  const { safe } = useSafeInfo()

  const addedOwners = newOwners
    .filter((owner) => safe.owners.every(({ value }) => value !== owner))
    .map((addedOwner) => ({ value: addedOwner }))
  const removedOwners = safe.owners
    .filter((owner) => !newOwners.includes(owner.value))
    .map((removedOwner) => ({
      value: removedOwner.value,
      name: removedOwner.name ?? undefined,
    }))

  if (addedOwners.length === 0 && removedOwners.length === 0) {
    return null
  }

  return (
    <FieldsGrid title="Actions">
      {removedOwners.length > 0 && (
        <OwnerList
          owners={removedOwners}
          title={`Remove owner${maybePlural(removedOwners)}`}
          icon={MinusIcon}
          sx={{ backgroundColor: ({ palette }) => `${palette.warning.background} !important`, mb: 2 }}
        />
      )}

      {addedOwners.length > 0 && <OwnerList owners={addedOwners} />}
    </FieldsGrid>
  )
}

function Signers({ owners }: { owners: Array<string> }): ReactElement {
  return (
    <FieldsGrid title="Signers">
      <Box display="flex" flexDirection="column" gap={2} padding="var(--space-2)" fontSize="14px">
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
