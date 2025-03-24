import { useMemo, useState, type ReactElement } from 'react'

import NestedSafeIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import TxLayout, { type TxStep } from '@/components/tx-flow/common/TxLayout'
import useTxStepper from '@/components/tx-flow/useTxStepper'
import { ReviewNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/ReviewNestedSafe'
import { SetUpNestedSafe } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import type { SetupNestedSafeForm } from '@/components/tx-flow/flows/CreateNestedSafe/SetupNestedSafe'
import { ConfirmTxDetails } from '@/components/tx/ConfirmTxDetails'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import useSafeInfo from '@/hooks/useSafeInfo'

export function CreateNestedSafe(): ReactElement {
  const dispatch = useAppDispatch()
  const { safe } = useSafeInfo()
  const [predictedSafeAddress, setPredictedSafeAddress] = useState<string | undefined>()

  const { data, step, nextStep, prevStep } = useTxStepper<SetupNestedSafeForm>({
    name: '',
    assets: [],
  })

  const handleSubmit = () => {
    if (!predictedSafeAddress) {
      return
    }
    dispatch(
      upsertAddressBookEntries({
        chainIds: [safe.chainId],
        address: predictedSafeAddress,
        name: data.name,
      }),
    )
  }

  const steps = useMemo<TxStep[]>(
    () => [
      {
        txLayoutProps: { title: 'Set up Nested Safe' },
        content: <SetUpNestedSafe key={0} params={data} onSubmit={(formData) => nextStep({ ...data, ...formData })} />,
      },
      {
        txLayoutProps: { title: 'Confirm Nested Safe' },
        content: (
          <ReviewNestedSafe
            key={1}
            params={data}
            onSubmit={(predictedSafeAddress) => {
              setPredictedSafeAddress(predictedSafeAddress)
              nextStep(data)
            }}
          />
        ),
      },
      {
        txLayoutProps: { title: 'Confirm transaction details', fixedNonce: true },
        content: <ConfirmTxDetails key={2} onSubmit={handleSubmit} />,
      },
    ],
    [nextStep, data],
  )

  return (
    <TxLayout
      subtitle="Create a Nested Safe"
      icon={NestedSafeIcon}
      step={step}
      onBack={prevStep}
      {...(steps?.[step]?.txLayoutProps || {})}
    >
      {steps.map(({ content }) => content)}
    </TxLayout>
  )
}
