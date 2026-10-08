import { useCallback } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import ModalDialog from '@/components/common/ModalDialog'
import { isValidURL } from '@safe-global/utils/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import { isSameUrl, trimTrailingSlash } from '@/utils/url'
import CustomApp from './CustomApp'
import { useShareSafeAppUrl } from '@/components/safe-apps/hooks/useShareSafeAppUrl'

import { BRAND_NAME } from '@/config/constants'
import { AddCustomAppModalView } from '@views/components/safe-apps/AddCustomAppModal/AddCustomAppModalView'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: SafeAppData) => void
  // A list of safe apps to check if the app is already there
  safeAppsList: SafeAppData[]
}

type CustomAppFormData = {
  appUrl: string
  riskAcknowledgement: boolean
  safeApp: SafeAppData
}

const APP_ALREADY_IN_THE_LIST_ERROR = 'This Safe App is already in the list'
const INVALID_URL_ERROR = 'The url is invalid'

export const AddCustomAppModal = ({ open, onClose, onSave, safeAppsList }: Props) => {
  const currentChain = useCurrentChain()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<CustomAppFormData>({ defaultValues: { riskAcknowledgement: false }, mode: 'onChange' })

  const onSubmit: SubmitHandler<CustomAppFormData> = () => {
    if (safeApp) {
      onSave(safeApp)
      trackSafeAppEvent(SAFE_APPS_EVENTS.ADD_CUSTOM_APP, safeApp.url)
      reset()
      onClose()
    }
  }

  const appUrl = watch('appUrl')
  const debouncedUrl = useDebounce(trimTrailingSlash(appUrl || ''), 300)

  const [safeApp, manifestError] = useAsync<SafeAppData | undefined>(() => {
    if (!isValidURL(debouncedUrl)) return

    return fetchSafeAppFromManifest(debouncedUrl, currentChain?.chainId || '')
  }, [currentChain, debouncedUrl])

  const handleClose = () => {
    reset()
    onClose()
  }

  const isAppAlreadyInTheList = useCallback(
    (appUrl: string) => safeAppsList.some((app) => isSameUrl(app.url, appUrl)),
    [safeAppsList],
  )

  const shareSafeAppUrl = useShareSafeAppUrl(safeApp?.url || '')
  const isSafeAppValid = isValid && safeApp
  const isCustomAppInTheDefaultList = errors?.appUrl?.type === 'alreadyExists'

  return (
    <AddCustomAppModalView
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      brandName={BRAND_NAME}
      appUrlRegistration={register('appUrl', {
        required: true,
        validate: {
          validUrl: (val: string) => (isValidURL(val) ? undefined : INVALID_URL_ERROR),
          alreadyExists: (val: string) => (isAppAlreadyInTheList(val) ? APP_ALREADY_IN_THE_LIST_ERROR : undefined),
        },
      })}
      appUrlError={errors?.appUrl?.type === 'validUrl' ? errors?.appUrl?.message : undefined}
      customApp={
        safeApp && <CustomApp safeApp={safeApp} shareUrl={isCustomAppInTheDefaultList ? shareSafeAppUrl : ''} />
      }
      isCustomAppInTheDefaultList={isCustomAppInTheDefaultList}
      hasManifestError={!!(isValidURL(debouncedUrl) && manifestError)}
      hasRiskAcknowledgementError={!!errors.riskAcknowledgement}
      isSubmitDisabled={!isSafeAppValid}
      renderModalDialog={(props) => <ModalDialog {...props} />}
      renderRiskAcknowledgementController={(render) => (
        <Controller
          control={control}
          name="riskAcknowledgement"
          rules={{ required: true }}
          render={({ field }) => render(field)}
        />
      )}
    />
  )
}
