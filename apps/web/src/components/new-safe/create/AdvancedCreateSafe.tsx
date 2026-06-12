import { ECOSYSTEM_ID_ADDRESS } from '@/config/constants'
import { Typography } from '@/components/ui/typography'
import { useRouter } from 'next/router'

import useWallet from '@/hooks/wallets/useWallet'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import type { TxStepperProps } from '@/components/new-safe/CardStepper/useCardStepper'
import SetNameStep from '@/components/new-safe/create/steps/SetNameStep'
import OwnerPolicyStep from '@/components/new-safe/create/steps/OwnerPolicyStep'
import ReviewStep from '@/components/new-safe/create/steps/ReviewStep'
import { CreateSafeStatus } from '@/components/new-safe/create/steps/StatusStep'
import { CardStepper } from '@/components/new-safe/CardStepper'
import { getNewSafeReturnUrl } from '@/components/new-safe/getReturnUrl'
import { CREATE_SAFE_CATEGORY } from '@/services/analytics'
import type { CreateSafeInfoItem } from '@/components/new-safe/create/CreateSafeInfos'
import CreateSafeInfos from '@/components/new-safe/create/CreateSafeInfos'
import { useState } from 'react'
import { type NewSafeFormData } from '.'
import AdvancedOptionsStep from './steps/AdvancedOptionsStep'
import { useCurrentChain } from '@/hooks/useChains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const AdvancedCreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const [safeName, setSafeName] = useState('')
  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState(0)

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Select network and name of your Safe Account',
      subtitle: 'Select the network on which to create your Safe Account',
      render: (data, onSubmit, onBack, setStep) => (
        <SetNameStep
          isAdvancedFlow
          setSafeName={setSafeName}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          setOverviewNetworks={() => {}}
          setDynamicHint={() => {}}
        />
      ),
    },
    {
      title: 'Signers and confirmations',
      subtitle:
        'Set the signer wallets of your Safe Account and how many need to confirm to execute a valid transaction.',
      render: (data, onSubmit, onBack, setStep) => (
        <OwnerPolicyStep
          setDynamicHint={setDynamicHint}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
        />
      ),
    },
    {
      title: 'Advanced settings',
      subtitle: 'Choose the Safe version and optionally a specific salt nonce',
      render: (data, onSubmit, onBack, setStep) => (
        <AdvancedOptionsStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
      ),
    },
    {
      title: 'Review',
      subtitle:
        "You're about to create a new Safe Account and will have to confirm the transaction with your connected wallet.",
      render: (data, onSubmit, onBack, setStep) => (
        <ReviewStep data={data} onSubmit={onSubmit} onBack={onBack} setStep={setStep} />
      ),
    },
    {
      title: '',
      subtitle: '',
      render: (data, onSubmit, onBack, setStep, setProgressColor, setStepData) => (
        <CreateSafeStatus
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
          setProgressColor={setProgressColor}
          setStepData={setStepData}
        />
      ),
    },
  ]

  const initialStep = 0
  const initialData: NewSafeFormData = {
    name: '',
    networks: [],
    owners: [],
    threshold: 1,
    saltNonce: 0,
    safeVersion: getLatestSafeVersion(chain),
    paymentReceiver: ECOSYSTEM_ID_ADDRESS,
  }

  const onClose = () => {
    router.push(getNewSafeReturnUrl(router.query.next))
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4">
      <div className="mt-4 grid grid-cols-12 justify-center gap-x-6 md:mt-14">
        <div className="col-span-12">
          <Typography variant="h2" className="pb-4">
            Create new Safe Account
          </Typography>
        </div>
        <div className="order-1 col-span-12 md:order-0 md:col-span-8">
          <CardStepper
            initialData={initialData}
            initialStep={initialStep}
            onClose={onClose}
            steps={CreateSafeSteps}
            eventCategory={CREATE_SAFE_CATEGORY}
            setWidgetStep={setActiveStep}
          />
        </div>

        <div className="order-0 col-span-12 mb-6 md:order-1 md:col-span-4 md:mb-0">
          <div className="grid grid-cols-12 gap-6">
            {activeStep < 2 && <OverviewWidget safeName={safeName} networks={[]} />}
            {wallet?.address && <CreateSafeInfos dynamicHint={dynamicHint} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedCreateSafe
