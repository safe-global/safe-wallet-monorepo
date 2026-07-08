import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useMnemonicSafeName } from '@/hooks/useMnemonicName'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'

import layoutCss from '@/components/new-safe/create/styles.module.css'
import NameInput from '@/components/common/NameInput'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import NextLink from 'next/link'
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
    router.push(AppRoutes.welcome.index)
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
      <form onSubmit={handleSubmit(onFormSubmit)} id={SET_NAME_STEP_FORM_ID}>
        <div className={layoutCss.row}>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12">
              <NameInput
                name={SetNameStepFields.name}
                label={errors?.[SetNameStepFields.name]?.message || 'Name'}
                placeholder={fallbackName}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="flex items-center">
                            <InfoIcon className="size-5" />
                          </span>
                        }
                      />
                      <TooltipContent>
                        This name is stored locally and will never be shared with us or any third parties.
                      </TooltipContent>
                    </Tooltip>
                  ),
                }}
              />
            </div>

            <div className="col-span-12">
              <Typography variant="h4" className="mt-4 inline-flex items-center gap-2">
                Select networks
              </Typography>
              <Typography variant="paragraph-small" className="mb-4 block">
                Choose which networks you want your account to be active on. You can add more networks later.{' '}
              </Typography>
              <SafeCreationNetworkInput isAdvancedFlow={isAdvancedFlow} name={SetNameStepFields.networks} />
            </div>
          </div>
          <Typography variant="paragraph-small" className="mt-4 block">
            By continuing, you agree to our <Link render={<NextLink href={AppRoutes.terms} />}>terms of use</Link> and{' '}
            <Link render={<NextLink href={AppRoutes.privacy} />}>privacy policy</Link>.
          </Typography>

          <NoWalletConnectedWarning />
        </div>
        <Separator />
        <div className={layoutCss.row}>
          <div className="flex flex-row justify-between gap-6">
            <Button data-testid="cancel-btn" variant="outline" onClick={onCancel} size="lg">
              Cancel
            </Button>
            <Button data-testid="next-btn" type="submit" variant="default" size="lg" disabled={isDisabled}>
              Next
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

export default SetNameStep
