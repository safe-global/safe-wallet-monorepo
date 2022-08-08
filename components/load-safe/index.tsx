import React from 'react'
import { useRouter } from 'next/router'

import { TxStepperProps } from '@/components/tx/TxStepper/useTxStepper'
import VerticalTxStepper from '@/components/tx/TxStepper/vertical'
import { AppRoutes } from '@/config/routes'
import SafeOwnersStep from '@/components/load-safe/steps/SafeOwnersStep'
import SetAddressStep from '@/components/load-safe/steps/SetAddressStep'
import SafeReviewStep from '@/components/load-safe/steps/SafeReviewStep'
import SelectNetworkStep from '@/components/load-safe/steps/SelectNetworkStep'
import { Owner } from '@/components/create-safe'

export type LoadSafeFormData = {
  safeAddress: Owner
  threshold: number
  owners?: Owner[]
  chainId: string
}

export type LoadSafeFormDataReview = Omit<LoadSafeFormData, 'owners'> & { owners: Owner[] }

export const LoadSafeSteps: TxStepperProps['steps'] = [
  {
    label: 'Connect wallet & select network',
    render: (_, onSubmit, onBack) => <SelectNetworkStep onSubmit={onSubmit} onBack={onBack} />,
  },
  {
    label: 'Name and address',
    render: (data, onSubmit, onBack) => (
      <SetAddressStep params={data as LoadSafeFormData} onSubmit={onSubmit} onBack={onBack} />
    ),
  },
  {
    label: 'Owners',
    render: (data, onSubmit, onBack) => (
      <SafeOwnersStep params={data as LoadSafeFormData} onSubmit={onSubmit} onBack={onBack} />
    ),
  },
  {
    label: 'Review',
    render: (data, _, onBack) => <SafeReviewStep params={data as LoadSafeFormDataReview} onBack={onBack} />,
  },
]

const LoadSafe = ({
  initialStep,
  initialData,
}: {
  initialStep?: TxStepperProps['initialStep']
  initialData?: TxStepperProps['initialData']
}) => {
  const router = useRouter()

  return (
    <VerticalTxStepper
      steps={LoadSafeSteps}
      initialStep={initialStep}
      initialData={initialData}
      onClose={() => router.push(AppRoutes.welcome)}
    />
  )
}

export default LoadSafe
