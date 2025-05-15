import { useCallback, useContext, useMemo, useState, type ReactElement } from 'react'
import NestedSafeIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import { ReviewNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/ReviewNestedSafe'
import { SetUpNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import type { SetupNestedSafeForm } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type SubmitCallbackWithData, TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

export function CreateNestedSafe(): ReactElement {
  const dispatch = useAppDispatch()
  const { safe } = useSafeInfo()
  const [predictedSafeAddress, setPredictedSafeAddress] = useState<string | undefined>()

  const ReviewNestedSafeCreationComponent = useMemo<typeof ReviewTransaction>(
    () =>
      function ReviewNestedSafeCreation({ onSubmit, ...props }) {
        const { data } = useContext<TxFlowContextType<SetupNestedSafeForm>>(TxFlowContext)

        const handleSubmit = useCallback(
          (predictedSafeAddress?: string) => {
            setPredictedSafeAddress(predictedSafeAddress)
            onSubmit()
          },
          [onSubmit],
        )

        return <ReviewNestedSafe {...props} params={data!} onSubmit={handleSubmit} />
      },
    [setPredictedSafeAddress],
  )

  const handleSubmit = useCallback<SubmitCallbackWithData<SetupNestedSafeForm>>(
    (args) => {
      if (!predictedSafeAddress) {
        return
      }
      dispatch(
        upsertAddressBookEntries({
          chainIds: [safe.chainId],
          address: predictedSafeAddress,
          name: args?.data?.name ?? '',
        }),
      )
    },
    [dispatch, predictedSafeAddress, safe.chainId],
  )

  return (
    <TxFlow<SetupNestedSafeForm>
      initialData={{ name: '', assets: [] }}
      icon={NestedSafeIcon}
      subtitle="Create a Nested Safe"
      ReviewTransactionComponent={ReviewNestedSafeCreationComponent}
      onSubmit={handleSubmit}
    >
      <TxFlowStep title="Set up Nested Safe">
        <SetUpNestedSafe />
      </TxFlowStep>
    </TxFlow>
  )
}
