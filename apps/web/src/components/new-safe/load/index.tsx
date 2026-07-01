import React from 'react'
import { useRouter } from 'next/router'

import { LOAD_SAFE_CATEGORY } from '@/services/analytics'
import { Typography } from '@/components/ui/typography'
import { CardStepper } from '@/components/new-safe/CardStepper'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NamedAddress } from '@/components/new-safe/create/types'
import SetAddressStep from '@/components/new-safe/load/steps/SetAddressStep'
import { getNewSafeReturnUrl } from '@/components/new-safe/getReturnUrl'
import SafeOwnerStep from '@/components/new-safe/load/steps/SafeOwnerStep'
import SafeReviewStep from '@/components/new-safe/load/steps/SafeReviewStep'

export type LoadSafeFormData = NamedAddress & {
  threshold: number
  owners: NamedAddress[]
}

export const LoadSafeSteps: TxStepperProps<LoadSafeFormData>['steps'] = [
  {
    title: 'Choose address, network and a name',
    subtitle: 'Paste the address of the Safe account you want to add, select the network and choose a name.',
    render: (data, onSubmit, onBack, setStep) => (
      <SetAddressStep onSubmit={onSubmit} onBack={onBack} data={data} setStep={setStep} />
    ),
  },
  {
    title: 'Signers and confirmations',
    subtitle: 'Optional: Provide a name for each signer.',
    render: (data, onSubmit, onBack, setStep) => (
      <SafeOwnerStep onSubmit={onSubmit} onBack={onBack} data={data} setStep={setStep} />
    ),
  },
  {
    title: 'Review',
    subtitle: 'Confirm adding Safe account to your Watchlist',
    render: (data, onSubmit, onBack, setStep) => (
      <SafeReviewStep onSubmit={onSubmit} onBack={onBack} data={data} setStep={setStep} />
    ),
  },
]

export const loadSafeDefaultData = { threshold: -1, owners: [], address: '', name: '' }

const LoadSafe = ({ initialData }: { initialData?: TxStepperProps<LoadSafeFormData>['initialData'] }) => {
  const router = useRouter()

  const onClose = () => {
    router.push(getNewSafeReturnUrl(router.query.next))
  }

  const initialSafe = initialData ?? loadSafeDefaultData

  return (
    <div data-testid="load-safe-form" className="mx-auto w-full max-w-[1200px] px-4">
      <div className="grid grid-cols-12 justify-center gap-x-6">
        <div className="col-span-12 md:col-span-10 lg:col-span-8">
          <Typography variant="h2" className="pb-4">
            Add existing Safe account
          </Typography>
        </div>
        <div className="order-1 col-span-12 md:order-0 md:col-span-10 lg:col-span-8">
          <CardStepper
            // Populate initial data
            key={initialSafe.address}
            initialData={initialSafe}
            onClose={onClose}
            steps={LoadSafeSteps}
            eventCategory={LOAD_SAFE_CATEGORY}
          />
        </div>
      </div>
    </div>
  )
}

export default LoadSafe
