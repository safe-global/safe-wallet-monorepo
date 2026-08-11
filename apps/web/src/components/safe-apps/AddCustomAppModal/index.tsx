import { useCallback } from 'react'
import type { SubmitHandler } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import { Check, Info } from 'lucide-react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import ModalDialog from '@/components/common/ModalDialog'
import { isValidURL } from '@safe-global/utils/utils/validation'
import { useCurrentChain } from '@/hooks/useChains'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import { isSameUrl, trimTrailingSlash } from '@/utils/url'
import CustomAppPlaceholder from './CustomAppPlaceholder'
import CustomApp from './CustomApp'
import { useShareSafeAppUrl } from '@/components/safe-apps/hooks/useShareSafeAppUrl'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'

import css from './styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { BRAND_NAME } from '@/config/constants'

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

const HELP_LINK = 'https://docs.safe.global/apps-sdk-overview'
const APP_ALREADY_IN_THE_LIST_ERROR = 'This Safe App is already in the list'
const MANIFEST_ERROR = "The app doesn't support Safe App functionality"
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
    <ModalDialog open={open} onClose={handleClose} dialogTitle="Add custom Safe App">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={css.addCustomAppContainer}>
          <div className={css.addCustomAppFields}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="appUrl">Safe App URL</Label>
              <Input
                id="appUrl"
                error={errors?.appUrl?.type === 'validUrl' ? errors?.appUrl?.message : undefined}
                autoComplete="off"
                {...register('appUrl', {
                  required: true,
                  validate: {
                    validUrl: (val: string) => (isValidURL(val) ? undefined : INVALID_URL_ERROR),
                    alreadyExists: (val: string) =>
                      isAppAlreadyInTheList(val) ? APP_ALREADY_IN_THE_LIST_ERROR : undefined,
                  },
                })}
              />
            </div>
            <div className="mt-4">
              {safeApp ? (
                <>
                  <CustomApp safeApp={safeApp} shareUrl={isCustomAppInTheDefaultList ? shareSafeAppUrl : ''} />
                  {isCustomAppInTheDefaultList ? (
                    <div className="mt-4 flex items-center">
                      <Check className="text-[var(--color-success-main)]" />
                      <Typography className="ml-2">This Safe App is already registered</Typography>
                    </div>
                  ) : (
                    <>
                      <Controller
                        control={control}
                        name="riskAcknowledgement"
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Field orientation="horizontal" className="mt-4">
                            <Checkbox id="riskAcknowledgement" checked={field.value} onCheckedChange={field.onChange} />
                            <FieldLabel htmlFor="riskAcknowledgement" className="font-normal">
                              {`This Safe App is not part of ${BRAND_NAME} and I agree to use it at my own risk.`}
                            </FieldLabel>
                          </Field>
                        )}
                      />

                      {errors.riskAcknowledgement && (
                        <p role="alert" className="mt-1 text-sm text-destructive">
                          Accepting the disclaimer is mandatory
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <CustomAppPlaceholder error={isValidURL(debouncedUrl) && manifestError ? MANIFEST_ERROR : ''} />
              )}
            </div>
          </div>

          <div className={css.addCustomAppHelp}>
            <Info className={css.addCustomAppHelpIcon} />
            <Typography className="ml-0.5">Learn more about building</Typography>
            <ExternalLink className={`${css.addCustomAppHelpLink} font-bold`} href={HELP_LINK}>
              Safe Apps
            </ExternalLink>
            .
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!isSafeAppValid}>
            Add
          </Button>
        </div>
      </form>
    </ModalDialog>
  )
}
