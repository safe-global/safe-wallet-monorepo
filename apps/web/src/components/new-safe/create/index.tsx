import { useRouter } from 'next/router'

import useWallet from '@/hooks/wallets/useWallet'
import OverviewWidget from '@/components/new-safe/create/OverviewWidget'
import type { NamedAddress } from '@/components/new-safe/create/types'
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
import { useMemo, useState } from 'react'
import { type SafeVersion } from '@safe-global/types-kit'
import { useCurrentChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { CREATE_SAFE_STATIC_HINTS, CreateView } from '@views/components/new-safe/create/CreateView'

export type NewSafeFormData = {
  name: string
  networks: Chain[]
  threshold: number
  owners: NamedAddress[]
  saltNonce?: number
  safeVersion: SafeVersion
  safeAddress?: string
  willRelay?: boolean
  paymentReceiver?: string
}

const CreateSafe = () => {
  const router = useRouter()
  const wallet = useWallet()
  const chain = useCurrentChain()

  const [safeName, setSafeName] = useState('')
  const [overviewNetworks, setOverviewNetworks] = useState<Chain[]>()

  const [dynamicHint, setDynamicHint] = useState<CreateSafeInfoItem>()
  const [activeStep, setActiveStep] = useState(0)

  const CreateSafeSteps: TxStepperProps<NewSafeFormData>['steps'] = [
    {
      title: 'Set up the basics',
      subtitle: 'Give a name to your account and select which networks to deploy it on.',
      render: (data, onSubmit, onBack, setStep) => (
        <SetNameStep
          setOverviewNetworks={setOverviewNetworks}
          setDynamicHint={setDynamicHint}
          setSafeName={setSafeName}
          data={data}
          onSubmit={onSubmit}
          onBack={onBack}
          setStep={setStep}
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

  const staticHint = useMemo(() => CREATE_SAFE_STATIC_HINTS[activeStep], [activeStep])

  const initialStep = 0
  const initialData: NewSafeFormData = {
    name: '',
    networks: [],
    owners: [],
    threshold: 1,
    safeVersion: getLatestSafeVersion(chain) as SafeVersion,
  }

  const onClose = () => {
    router.push(getNewSafeReturnUrl(router.query.next))
  }

  return (
    <CreateView
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
      overviewWidget={<OverviewWidget safeName={safeName} networks={overviewNetworks || []} />}
      walletAddress={wallet?.address}
      createSafeInfos={<CreateSafeInfos staticHint={staticHint} dynamicHint={dynamicHint} />}
    />
  )
}

export default CreateSafe
