import { useMemo, useContext } from 'react'
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
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { ManageSignersForm } from '@/components/tx-flow/flows/ManagerSigners'
import type { TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'

export function ManageSigners({
  txInfo,
  txData,
}: {
  txInfo: TransactionInfo
  txData: TransactionDetails['txData']
}): ReactElement {
  const { safe } = useSafeInfo()
  // Extract signer names from context
  const { data } = useContext<TxFlowContextType<ManageSignersForm>>(TxFlowContext)

  const signerNames = useMemo(() => {
    return data
      ? Object.fromEntries(
          data.owners.filter((owner) => owner.name).map((owner) => [checksumAddress(owner.address), owner.name]),
        )
      : {}
  }, [data])

  const { newOwners, newThreshold } = useMemo(() => {
    return getNewSafeSetup({
      txInfo,
      txData,
      safe,
      signerNames,
    })
  }, [txInfo, txData, safe, signerNames])

  return (
    <Stack display="flex" flexDirection="column" gap={3} sx={{ '& .MuiGrid-container': { alignItems: 'flex-start' } }}>
      <ChangeSignerSetupWarning />

      <Actions newOwners={newOwners} />

      <Signers owners={newOwners} />

      <Threshold owners={newOwners} threshold={newThreshold} />
    </Stack>
  )
}

function Actions({ newOwners }: { newOwners: Array<AddressInfo> }): ReactElement | null {
  const { safe } = useSafeInfo()

  const addedOwners = newOwners
    .filter((owner) => safe.owners.every(({ value }) => value !== owner.value))
    .map((addedOwner) => ({
      value: addedOwner.value,
      name: addedOwner.name ?? undefined,
    }))
  const removedOwners = safe.owners
    .filter((owner) => !newOwners.some((newOwner) => sameAddress(newOwner.value, owner.value)))
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

function Signers({ owners }: { owners: Array<AddressInfo> }): ReactElement {
  return (
    <FieldsGrid title="Signers">
      <Box display="flex" flexDirection="column" gap={2} padding="var(--space-2)" fontSize="14px">
        {owners.map(({ value, name }) => (
          <EthHashInfo
            avatarSize={32}
            key={value}
            showName
            address={value}
            shortAddress={false}
            showCopyButton
            hasExplorer
            name={name}
          />
        ))}
      </Box>
    </FieldsGrid>
  )
}

function Threshold({ owners, threshold }: { owners: Array<AddressInfo>; threshold: number }): ReactElement {
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
