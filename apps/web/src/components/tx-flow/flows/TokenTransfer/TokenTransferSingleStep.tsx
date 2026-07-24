import { useContext, useMemo } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Stack } from '@mui/material'
import uniq from 'lodash/uniq'
import { TxFlowStep } from '../../TxFlowStep'
import TxCard from '../../common/TxCard'
import { TxActions } from '../../actions'
import ReviewTransactionContent from '@/components/tx/ReviewTransactionV2/ReviewTransactionContent'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import { BalanceChanges, FeesPreview, FeeInfoBanner, SignerSelect, RiskConfirmation } from '../../features'
import { useSafeShieldForRecipients } from '@/features/safe-shield/SafeShieldContext'
import RecipientRow from './RecipientRow'
import { TokenTransferSidebarSlot } from './TokenTransferSidebar'
import { useTokenTransferSafeTx } from './useTokenTransferSafeTx'
import { MultiTokenTransferFields, type MultiTokenTransferParams } from './types'

/**
 * Single-screen Token Transfer: the form, the live decoded preview, the live hashes and the
 * sign/execute actions all live on one step. The safeTx (and therefore the hashes) rebuilds from
 * the debounced form values, so everything below the form refreshes as the user types.
 */
const TokenTransferSingleStep = ({ txNonce }: { txNonce?: number }) => {
  const { data, onFlowSubmit } = useContext(TxFlowContext) as TxFlowContextType<MultiTokenTransferParams>

  const formMethods = useForm<MultiTokenTransferParams>({
    defaultValues: data,
    mode: 'onChange',
    delayError: 500,
  })
  const { control } = formMethods

  const recipients = useWatch({ control, name: MultiTokenTransferFields.recipients })

  useTokenTransferSafeTx(recipients ?? [], txNonce)

  const recipientAddresses = useMemo(
    () => uniq((recipients ?? []).map((recipient) => recipient.recipient).filter(Boolean)),
    [recipients],
  )
  useSafeShieldForRecipients(recipientAddresses)

  return (
    <TxFlowStep title="New transaction">
      <FormProvider {...formMethods}>
        <TxCard>
          <Stack spacing={3}>
            <RecipientRow
              fieldArray={{ name: MultiTokenTransferFields.recipients, index: 0 }}
              removable={false}
              disableSpendingLimit
            />
          </Stack>
        </TxCard>

        <ReviewTransactionContent onSubmit={onFlowSubmit} actions={<TxActions onSubmit={() => onFlowSubmit()} />}>
          <BalanceChanges />
          <FeesPreview />
          <FeeInfoBanner />
          <SignerSelect />
          <RiskConfirmation />
        </ReviewTransactionContent>
      </FormProvider>

      <TokenTransferSidebarSlot />
    </TxFlowStep>
  )
}

export default TokenTransferSingleStep
