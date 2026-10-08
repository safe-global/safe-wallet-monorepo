import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import InfoIcon from '@/public/images/notifications/info.svg'
import { largeFormFieldSurfaceClassName } from '@/components/common/formFieldStyles'
import ExternalLink from '@/components/common/ExternalLink'
import { PRIVACY_URL, TERMS_URL } from '@safe-global/utils/config/constants'

const networkSelectTriggerClassName = `${largeFormFieldSurfaceClassName} w-full`

export type SafeNameInputSlotProps = {
  label: string
  placeholder: string
  InputLabelProps: { shrink: boolean }
  inputSize: 'hero'
  variant: 'surface'
  InputProps: { endAdornment: ReactNode }
}

export type SetAddressStepViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  onBack: () => void
  isValid: boolean
  nameError?: string
  fallbackName: string
  resolving: boolean
  renderNameInput: (props: SafeNameInputSlotProps) => ReactNode
  renderNetworkSelector: (props: { triggerClassName: string }) => ReactNode
  renderAddressInput: (props: { 'data-testid': string; label: string }) => ReactNode
}

export function SetAddressStepView({
  onSubmit,
  onBack,
  isValid,
  nameError,
  fallbackName,
  resolving,
  renderNameInput,
  renderNetworkSelector,
  renderAddressInput,
}: SetAddressStepViewProps): ReactElement {
  return (
    <form onSubmit={onSubmit}>
      <div className={layoutCss.row}>
        <div className="mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
            <div className="order-last md:order-first">
              {renderNameInput({
                label: nameError || 'Name',
                placeholder: fallbackName,
                InputLabelProps: { shrink: true },
                inputSize: 'hero',
                variant: 'surface',
                InputProps: {
                  endAdornment: resolving ? (
                    <div className="flex items-center">
                      <Spinner className="size-5" />
                    </div>
                  ) : (
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
                },
              })}
            </div>
            <div className="order-first w-full md:order-last md:w-[220px]">
              {renderNetworkSelector({ triggerClassName: networkSelectTriggerClassName })}
            </div>
          </div>

          {renderAddressInput({ 'data-testid': 'address-section', label: 'Safe account' })}
        </div>

        <Typography className="mt-8 block">
          By continuing you consent to the{' '}
          <ExternalLink href={TERMS_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
            terms of use
          </ExternalLink>{' '}
          and{' '}
          <ExternalLink href={PRIVACY_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
            privacy policy
          </ExternalLink>
          .
        </Typography>
      </div>

      <Separator />

      <div className={layoutCss.row}>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Back
          </Button>
          <Button data-testid="load-safe-next-btn" type="submit" size="lg" disabled={!isValid}>
            Next
          </Button>
        </div>
      </div>
    </form>
  )
}
