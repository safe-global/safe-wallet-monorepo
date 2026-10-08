import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import type { ControllerRenderProps, UseFormRegisterReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft as ArrowBackIcon } from 'lucide-react'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import InfoIcon from '@/public/images/notifications/info.svg'

type SafeVersionField = Pick<ControllerRenderProps, 'value' | 'onChange'>
export type SaltNonceFieldSlotProps = UseFormRegisterReturn & {
  fullWidth: boolean
  label: string
  error: boolean
  helperText?: string
}

type PaymentReceiverField = Pick<ControllerRenderProps, 'name' | 'value' | 'onChange' | 'onBlur'>
type PaymentReceiverFieldState = { invalid: boolean; error?: { message?: string } }

export type AdvancedOptionsStepViewProps = {
  formId: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onBack: () => void
  isDisabled: boolean
  isDeployed: boolean
  renderSafeVersionController: (render: (field: SafeVersionField) => ReactElement) => ReactNode
  renderPaymentReceiverController: (
    render: (field: PaymentReceiverField, fieldState: PaymentReceiverFieldState) => ReactElement,
  ) => ReactNode
  saltNonceRegistration: UseFormRegisterReturn
  renderSaltNonceField: (props: SaltNonceFieldSlotProps) => ReactNode
  hasSaltNonceError: boolean
  saltNonceErrorMessage?: string
  predictedSafeAddressInfo?: ReactNode
}

export function AdvancedOptionsStepView({
  formId,
  onSubmit,
  onBack,
  isDisabled,
  isDeployed,
  renderSafeVersionController,
  renderPaymentReceiverController,
  saltNonceRegistration,
  renderSaltNonceField,
  hasSaltNonceError,
  saltNonceErrorMessage,
  predictedSafeAddressInfo,
}: AdvancedOptionsStepViewProps): ReactElement {
  return (
    <form data-testid="advanced-options-step-form" onSubmit={onSubmit} id={formId}>
      <div className="flex flex-col gap-4">
        <div className={layoutCss.row}>
          <Typography variant="h4" className="inline-flex items-center gap-2">
            Safe version
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="flex text-[var(--color-border-main)]">
                    <InfoIcon className="size-4" />
                  </span>
                }
              />
              <TooltipContent>
                The threshold of a Safe account specifies how many signers need to confirm a Safe account transaction
                before it can be executed.
              </TooltipContent>
            </Tooltip>
          </Typography>
          <Typography variant="paragraph-small" className="mb-4 block">
            Changes the used master copy and fallback handler of the Safe.
          </Typography>
          {renderSafeVersionController((field) => (
            <Field>
              <FieldLabel htmlFor="advanced-safe-version">Safe version</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="advanced-safe-version" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.4.1">1.4.1 (latest)</SelectItem>
                  <SelectItem value="1.3.0">1.3.0</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ))}

          <Typography variant="h4" className="mt-8 inline-flex w-full items-center gap-2">
            Salt nonce
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="flex text-[var(--color-border-main)]">
                    <InfoIcon className="size-4" />
                  </span>
                }
              />
              <TooltipContent>
                The salt nonce changes the predicted Safe address. It can be used to re-create a Safe from another chain
                or to create a specific Safe address
              </TooltipContent>
            </Tooltip>
          </Typography>
          <Typography variant="paragraph-small" className="mb-4 block">
            Impacts the derived Safe address
          </Typography>
          {renderSaltNonceField({
            ...saltNonceRegistration,
            fullWidth: true,
            label: 'Salt nonce',
            error: hasSaltNonceError || isDeployed,
            helperText:
              saltNonceErrorMessage ||
              (isDeployed ? 'The Safe is already deployed. Use a different salt nonce.' : undefined),
          })}

          <Typography variant="h4" className="mt-8 inline-flex w-full items-center gap-2">
            Payment receiver
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="flex text-[var(--color-border-main)]">
                    <InfoIcon className="size-4" />
                  </span>
                }
              />
              <TooltipContent>The payment receiver changes the predicted Safe address.</TooltipContent>
            </Tooltip>
          </Typography>
          <Typography variant="paragraph-small" className="mb-4 block">
            Impacts the derived Safe address
          </Typography>
          {renderPaymentReceiverController((field, fieldState) => {
            const isInvalid = fieldState.invalid || isDeployed

            return (
              <Field data-invalid={isInvalid || undefined}>
                <FieldLabel htmlFor="advanced-payment-receiver">Payment receiver</FieldLabel>
                <Input
                  id="advanced-payment-receiver"
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={isInvalid || undefined}
                  error={
                    fieldState.error?.message ||
                    (isDeployed ? 'The Safe is already deployed. Use a different payment receiver.' : undefined)
                  }
                />
              </Field>
            )
          })}
        </div>

        <Separator />

        <div className={layoutCss.row}>
          <Typography variant="h4" className="mb-2">
            New Safe address
          </Typography>
          {predictedSafeAddressInfo ? predictedSafeAddressInfo : <Skeleton className="h-5 w-full" />}
        </div>

        <Separator />

        <div className={layoutCss.row}>
          <div className="flex flex-row justify-between gap-6">
            <Button data-testid="back-btn" variant="outline" size="lg" onClick={onBack}>
              <ArrowBackIcon className="size-4" />
              Back
            </Button>
            <Button data-testid="next-btn" type="submit" variant="default" size="lg" disabled={isDisabled}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
