import { useCallback, useContext, useMemo, useState } from 'react'
import NestedSafeIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import { ReviewNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/ReviewNestedSafe'
import { SetUpNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import type { SetupNestedSafeForm } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import { useAppDispatch, useAppSelector } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { selectCuratedNestedSafes, setCuratedNestedSafes } from '@/store/settingsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type SubmitCallbackWithData, TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'

const CreateNestedSafe = () => {
  const dispatch = useAppDispatch()
  const { safe, safeAddress } = useSafeInfo()
  const [predictedSafeAddress, setPredictedSafeAddress] = useState<string | undefined>()
  const curationState = useAppSelector((state) => selectCuratedNestedSafes(state, safeAddress))

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

      // Auto-add to curated list if curation was already completed
      // This ensures newly created nested safes appear in the user's visible list
      if (curationState?.hasCompletedCuration) {
        const normalizedAddress = predictedSafeAddress.toLowerCase()
        const currentAddresses = curationState.selectedAddresses ?? []

        // Only add if not already in the list
        if (!currentAddresses.includes(normalizedAddress)) {
          dispatch(
            setCuratedNestedSafes({
              parentSafeAddress: safeAddress,
              selectedAddresses: [...currentAddresses, normalizedAddress],
              hasCompletedCuration: true,
            }),
          )
        }
      }
    },
    [dispatch, predictedSafeAddress, safe.chainId, safeAddress, curationState],
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

export default CreateNestedSafe
