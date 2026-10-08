import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useMnemonicSafeName } from '@/hooks/useMnemonicName'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'

import NameInput from '@/components/common/NameInput'
import { getNewSafeReturnUrl } from '@/components/new-safe/getReturnUrl'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { useRouter } from 'next/router'
import NoWalletConnectedWarning from '../../NoWalletConnectedWarning'
import { type SafeVersion } from '@safe-global/types-kit'
import { useCurrentChain, useChain } from '@/hooks/useChains'
import { useEffect } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useSafeSetupHints } from '../OwnerPolicyStep/useSafeSetupHints'
import type { CreateSafeInfoItem } from '../../CreateSafeInfos'
import { SafeCreationNetworkInput } from '@/features/multichain'
import useWallet from '@/hooks/wallets/useWallet'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { SetNameStepView } from '@views/components/new-safe/create/steps/SetNameStep/SetNameStepView'

type SetNameStepForm = {
  name: string
  networks: Chain[]
  safeVersion: SafeVersion
}

export enum SetNameStepFields {
  name = 'name',
  networks = 'networks',
  safeVersion = 'safeVersion',
}

const SET_NAME_STEP_FORM_ID = 'create-safe-set-name-step-form'

function SetNameStep({
  data,
  onSubmit,
  setSafeName,
  setOverviewNetworks,
  setDynamicHint,
  isAdvancedFlow = false,
}: StepRenderProps<NewSafeFormData> & {
  setSafeName: (name: string) => void
  setOverviewNetworks: (networks: Chain[]) => void
  setDynamicHint: (hints: CreateSafeInfoItem | undefined) => void
  isAdvancedFlow?: boolean
}) {
  const router = useRouter()
  const currentChain = useCurrentChain()
  const wallet = useWallet()
  const walletChain = useChain(wallet?.chainId || '')

  const initialState = data.networks.length ? data.networks : walletChain ? [walletChain] : []
  const formMethods = useForm<SetNameStepForm>({
    mode: 'all',
    defaultValues: {
      ...data,
      networks: initialState,
    },
  })

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors, isValid },
  } = formMethods

  const networks: Chain[] = useWatch({ control, name: SetNameStepFields.networks })
  const isMultiChain = networks.length > 1
  const fallbackName = useMnemonicSafeName(isMultiChain)
  useSafeSetupHints(setDynamicHint, undefined, undefined, isMultiChain)

  const onFormSubmit = (data: Pick<NewSafeFormData, 'name' | 'networks'>) => {
    const name = data.name || fallbackName
    setSafeName(name)
    setOverviewNetworks(data.networks)

    onSubmit({ ...data, name })

    if (data.name) {
      trackEvent(CREATE_SAFE_EVENTS.NAME_SAFE)
    }
  }

  const onCancel = () => {
    trackEvent(CREATE_SAFE_EVENTS.CANCEL_CREATE_SAFE_FORM)
    router.push(getNewSafeReturnUrl(router.query.next))
  }

  // whenever the chain switches we need to update the latest Safe version and selected chain
  useEffect(() => {
    setValue(SetNameStepFields.safeVersion, getLatestSafeVersion(currentChain))
  }, [currentChain, setValue])

  // The form's default networks are computed once on mount; if the chain configs weren't
  // loaded yet at that point, seed the wallet's chain when it becomes available.
  useEffect(() => {
    if (!networks.length && walletChain) {
      setValue(SetNameStepFields.networks, [walletChain], { shouldValidate: true })
    }
    // Only a late-arriving walletChain should trigger the seed, not the user clearing the field
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletChain, setValue])

  const isDisabled = !isValid

  return (
    <FormProvider {...formMethods}>
      <SetNameStepView
        formId={SET_NAME_STEP_FORM_ID}
        onSubmit={handleSubmit(onFormSubmit)}
        onCancel={onCancel}
        isDisabled={isDisabled}
        nameError={errors?.[SetNameStepFields.name]?.message}
        fallbackName={fallbackName}
        renderNameInput={(props) => <NameInput name={SetNameStepFields.name} {...props} />}
        networkInput={<SafeCreationNetworkInput isAdvancedFlow={isAdvancedFlow} name={SetNameStepFields.networks} />}
        noWalletConnectedWarning={<NoWalletConnectedWarning />}
      />
    </FormProvider>
  )
}

export default SetNameStep
