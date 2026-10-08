import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import type { ControllerRenderProps, UseFormRegisterReturn } from 'react-hook-form'
import { Check, Info } from 'lucide-react'
import CustomAppPlaceholder from '@views/components/safe-apps/AddCustomAppModal/CustomAppPlaceholder'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import ExternalLink from '@/components/common/ExternalLink'
import css from './styles.module.css'

const HELP_LINK = 'https://docs.safe.global/apps-sdk-overview'
const MANIFEST_ERROR = "The app doesn't support Safe App functionality"

type CheckboxField = Pick<ControllerRenderProps, 'value' | 'onChange'>

export type ModalDialogSlotProps = {
  open: boolean
  onClose: () => void
  dialogTitle: string
  children: ReactNode
}

export type AddCustomAppModalViewProps = {
  open: boolean
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  brandName: string
  appUrlRegistration: UseFormRegisterReturn
  appUrlError?: string
  customApp?: ReactNode
  isCustomAppInTheDefaultList: boolean
  hasManifestError: boolean
  hasRiskAcknowledgementError: boolean
  isSubmitDisabled: boolean
  renderModalDialog: (props: ModalDialogSlotProps) => ReactNode
  renderRiskAcknowledgementController: (render: (field: CheckboxField) => ReactElement) => ReactNode
}

export function AddCustomAppModalView({
  open,
  onClose,
  onSubmit,
  brandName,
  appUrlRegistration,
  appUrlError,
  customApp,
  isCustomAppInTheDefaultList,
  hasManifestError,
  hasRiskAcknowledgementError,
  isSubmitDisabled,
  renderModalDialog,
  renderRiskAcknowledgementController,
}: AddCustomAppModalViewProps): ReactElement {
  return (
    <>
      {renderModalDialog({
        open,
        onClose,
        dialogTitle: 'Add custom Safe App',
        children: (
          <form onSubmit={onSubmit}>
            <div className={css.addCustomAppContainer}>
              <div className={css.addCustomAppFields}>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="appUrl">Safe App URL</Label>
                  <Input id="appUrl" error={appUrlError} autoComplete="off" {...appUrlRegistration} />
                </div>
                <div className="mt-4">
                  {customApp ? (
                    <>
                      {customApp}
                      {isCustomAppInTheDefaultList ? (
                        <div className="mt-4 flex items-center">
                          <Check className="text-[var(--color-success-main)]" />
                          <Typography className="ml-2">This Safe App is already registered</Typography>
                        </div>
                      ) : (
                        <>
                          {renderRiskAcknowledgementController((field) => (
                            <Field orientation="horizontal" className="mt-4">
                              <Checkbox
                                id="riskAcknowledgement"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <FieldLabel htmlFor="riskAcknowledgement" className="font-normal">
                                {`This Safe App is not part of ${brandName} and I agree to use it at my own risk.`}
                              </FieldLabel>
                            </Field>
                          ))}

                          {hasRiskAcknowledgementError && (
                            <p role="alert" className="mt-1 text-sm text-destructive">
                              Accepting the disclaimer is mandatory
                            </p>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <CustomAppPlaceholder error={hasManifestError ? MANIFEST_ERROR : ''} />
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

            <div className="flex justify-between gap-2 p-6 pt-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                Add
              </Button>
            </div>
          </form>
        ),
      })}
    </>
  )
}
