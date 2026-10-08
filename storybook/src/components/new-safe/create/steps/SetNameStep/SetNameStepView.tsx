import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import InfoIcon from '@/public/images/notifications/info.svg'
import layoutCss from '@/components/new-safe/create/styles.module.css'
import ExternalLink from '@/components/common/ExternalLink'
import { PRIVACY_URL, TERMS_URL } from '@safe-global/utils/config/constants'

export type NameInputSlotProps = {
  inputSize: 'hero'
  label: string
  placeholder: string
  className: string
  InputLabelProps: { shrink: boolean }
  InputProps: { endAdornment: ReactNode }
}

export type SetNameStepViewProps = {
  formId: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onCancel: () => void
  isDisabled: boolean
  nameError?: string
  fallbackName: string
  renderNameInput: (props: NameInputSlotProps) => ReactNode
  networkInput: ReactNode
  noWalletConnectedWarning: ReactNode
}

export function SetNameStepView({
  formId,
  onSubmit,
  onCancel,
  isDisabled,
  nameError,
  fallbackName,
  renderNameInput,
  networkInput,
  noWalletConnectedWarning,
}: SetNameStepViewProps): ReactElement {
  return (
    <form onSubmit={onSubmit} id={formId}>
      <div className={layoutCss.row}>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12">
            {renderNameInput({
              inputSize: 'hero',
              label: nameError || 'Name',
              placeholder: fallbackName,
              className: '[&_label]:text-base [&_label]:font-semibold',
              InputLabelProps: { shrink: true },
              InputProps: {
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
              },
            })}
          </div>

          <div className="col-span-12">
            <Typography variant="paragraph-bold" className="mt-4 inline-flex items-center gap-2">
              Select networks
            </Typography>
            <Typography variant="paragraph-small" className="mb-4 block">
              Choose which networks you want your account to be active on. You can add more networks later.{' '}
            </Typography>
            {networkInput}
          </div>
        </div>
        <Typography variant="paragraph-small" className="mt-4 block">
          By continuing, you agree to our{' '}
          <ExternalLink href={TERMS_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
            terms of use
          </ExternalLink>{' '}
          and{' '}
          <ExternalLink href={PRIVACY_URL} noIcon className="[&_span]:underline [&_span]:decoration-primary/40">
            privacy policy
          </ExternalLink>
          .
        </Typography>

        {noWalletConnectedWarning}
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
  )
}
