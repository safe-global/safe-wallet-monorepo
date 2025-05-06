import { Box, Stack } from '@mui/material'
import { useContext, useEffect } from 'react'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import { SafeTxContext } from '../../SafeTxProvider'
import { getOwnerStructureChangeTransaction } from '@/features/recovery/services/transaction'
import EthHashInfo from '@/components/common/EthHashInfo'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import FieldsGrid from '@/components/tx/FieldsGrid'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { TxFlowContext } from '../../TxFlowProvider'
import type { ChangeOwnerStructureForm } from '.'
import type { TxFlowContextType } from '../../TxFlowProvider'
import type { ReviewTransactionContentProps } from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'

export function ReviewStructure({ onSubmit, children }: ReviewTransactionContentProps): ReactElement {
  const { data } = useContext<TxFlowContextType<ChangeOwnerStructureForm>>(TxFlowContext)
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()

  useEffect(() => {
    if (!data) {
      return
    }

    const transactions = getOwnerStructureChangeTransaction({
      safe,
      newThreshold: data.threshold,
      newOwners: data.owners.map((owner) => ({
        value: owner.address,
      })),
    })

    const createSafeTx = async (): Promise<SafeTransaction> => {
      const isMultiSend = transactions.length > 1
      return isMultiSend ? createMultiSendCallOnlyTx(transactions) : createTx(transactions[0])
    }

    createSafeTx().then(setSafeTx).catch(setSafeTxError)
  }, [data, safe, safe.deployed, setSafeTx, setSafeTxError])

  return (
    <ReviewTransaction onSubmit={onSubmit}>
      {/* We cannot create a ConfirmationView out of the following as it accesses params */}
      <Stack
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
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
            {data?.owners.map((owner) => (
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
            {data?.threshold} of {data?.owners.length} signer{maybePlural(data?.owners ?? [])}
          </Box>{' '}
          required to confirm new transactions
        </FieldsGrid>
      </Stack>

      {children}
    </ReviewTransaction>
  )
}
