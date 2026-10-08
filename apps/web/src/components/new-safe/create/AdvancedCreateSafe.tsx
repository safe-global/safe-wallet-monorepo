import { ECOSYSTEM_ID_ADDRESS } from '@/config/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
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
import { AdvancedCreateSafeView } from '@views/components/new-safe/create/AdvancedCreateSafeView'

const AdvancedCreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const [safeName, setSafeName] = useState('')
  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState(0)

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Select network and name of your Safe account',
      subtitle: 'Select the network on which to create your Safe account',
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
        'Set the signer wallets of your Safe account and how many need to confirm to execute a valid transaction.',
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
        "You're about to create a new Safe account and will have to confirm the transaction with your connected wallet.",
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
    // Checksummed: the advanced step's `validateAddress` rejects the lowercase per-env value
    paymentReceiver: checksumAddress(ECOSYSTEM_ID_ADDRESS),
  }

  const onClose = () => {
    router.push(getNewSafeReturnUrl(router.query.next))
  }

  return (
    <AdvancedCreateSafeView
      stepper={
        <CardStepper
          initialData={initialData}
          initialStep={initialStep}
          onClose={onClose}
          steps={CreateSafeSteps}
          eventCategory={CREATE_SAFE_CATEGORY}
          setWidgetStep={setActiveStep}
        />
      }
      showOverview={activeStep < 2}
      overviewWidget={<OverviewWidget safeName={safeName} networks={[]} />}
      walletAddress={wallet?.address}
      createSafeInfos={<CreateSafeInfos dynamicHint={dynamicHint} />}
    />
  )
}

export default AdvancedCreateSafe
