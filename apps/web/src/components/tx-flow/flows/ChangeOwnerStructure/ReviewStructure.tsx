import { Box, Stack } from '@mui/material'
import { useContext, useEffect } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { getRecoveryProposalTransactions } from '@/features/recovery/services/transaction'
import EthHashInfo from '@/components/common/EthHashInfo'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { ChangeOwnerStructureForm } from '.'

export function ReviewStructure({ params }: { params: ChangeOwnerStructureForm }): ReactElement {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()

  useEffect(() => {
    const transactions = getRecoveryProposalTransactions({
      safe,
      newThreshold: params.threshold,
      newOwners: params.owners.map((owner) => ({
        value: owner.address,
      })),
    })

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = transactions.length > 1
      return isMultiSend ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [params.owners, params.threshold, safe, safe.deployed, setSafeTx, setSafeTxError])

  return (
    <SignOrExecuteForm>
      {/* We cannot create a ConfirmationView out of the following as it accesses params */}
      <Stack
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          mb: 2,
          '& .MuiGrid-container': {
            alignItems: 'flex-start',
          },
        }}
      >
        <FieldsGrid title="Signers">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              fontSize: '14px',
            }}
          >
            {params.owners.map((owner) => (
              <EthHashInfo
                avatarSize={32}
                key={owner.address}
                showName
                address={owner.address}
                shortAddress={false}
                showCopyButton
                hasExplorer
              />
            ))}
          </Box>
        </FieldsGrid>
        <FieldsGrid title="Threshold">
          <Box
            component="span"
            sx={{
              backgroundColor: 'background.main',
              py: 0.5,
              px: 1,
              borderRadius: ({ shape }) => `${shape.borderRadius}px`,
              fontWeight: 700,
            }}
          >
            {params.threshold} of {params.owners.length} signer{maybePlural(params.owners)}
          </Box>{' '}
          required to confirm new transactions
        </FieldsGrid>
      </Stack>
    </SignOrExecuteForm>
  )
}
