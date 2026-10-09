import { useState } from 'react'
import NextLink from 'next/link'
import { Controller, useFormContext } from 'react-hook-form'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { FieldDescription, FieldError } from '@/components/ui/field'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { ArrowRight, EyeIcon, EyeOffIcon, RotateCcwIcon } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'
import { useSafeProAccess } from '@/features/spaces'
import { cn } from '@/utils/cn'
import { EnvVariablesField, type EnvVariablesFormData } from './index'
import {
  getTenderlyUrlError,
  TENDERLY_SETUP_GUIDE_URL,
  TENDERLY_SIMULATE_URL_PLACEHOLDER,
  TENDERLY_TOKEN_ERROR,
  TENDERLY_TOKEN_PLACEHOLDER,
  TENDERLY_URL_HELPER_TEXT,
} from './utils'

type TenderlySectionProps = {
  onResetUrl: () => void
  onResetToken: () => void
  showResetUrlButton: boolean
  showResetTokenButton: boolean
}

const TenderlySection = ({
  onResetUrl,
  onResetToken,
  showResetUrlButton,
  showResetTokenButton,
}: TenderlySectionProps) => {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<EnvVariablesFormData>()
  const { hasProFeatures, spaceId } = useSafeProAccess()
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const tokenVisibilityLabel = isTokenVisible ? 'Hide access token' : 'Show access token'
  const urlError = errors[EnvVariablesField.tenderlyURL]
  const tokenError = errors[EnvVariablesField.tenderlyToken]
  const urlDescriptionId = `${EnvVariablesField.tenderlyURL}-description`
  const tokenErrorId = `${EnvVariablesField.tenderlyToken}-error`
  const plansHref = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces

  return (
    <>
      <Typography variant="paragraph-bold" className="mb-2 mt-6">
        Tenderly
      </Typography>

      <Alert variant="info" className="mb-4" data-testid="tenderly-info">
        <AlertSeverityIcon variant="info" />
        <AlertDescription>
          Transaction simulation is included in Safe Pro. You can also connect your own Tenderly project.{' '}
          <ExternalLink href={TENDERLY_SETUP_GUIDE_URL}>View setup guide</ExternalLink>
          {!hasProFeatures && (
            <span className="mt-2 flex">
              <Button variant="surface" size="sm" weight="semibold" render={<NextLink href={plansHref} />}>
                See plans
                <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
              </Button>
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={EnvVariablesField.tenderlyURL} className={cn('gap-1.5', urlError && 'text-destructive')}>
            Tenderly API URL
          </Label>
          <Controller
            name={EnvVariablesField.tenderlyURL}
            control={control}
            rules={{
              validate: (value) => !value || getTenderlyUrlError(value),
              deps: [EnvVariablesField.tenderlyToken],
            }}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id={EnvVariablesField.tenderlyURL}
                    value={field.value || ''}
                    type="url"
                    placeholder={TENDERLY_SIMULATE_URL_PLACEHOLDER}
                    // Without these the browser refills the field on reload, turning the placeholder hint into a value
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    aria-invalid={fieldState.invalid || undefined}
                    aria-describedby={urlDescriptionId}
                  />
                  {showResetUrlButton && (
                    <InputGroupAddon align="inline-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <InputGroupButton size="icon-sm" onClick={onResetUrl} aria-label="Reset to default value">
                              <RotateCcwIcon />
                            </InputGroupButton>
                          }
                        />
                        <TooltipContent>Reset to default value</TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  )}
                </InputGroup>
                {fieldState.error ? (
                  <FieldError id={urlDescriptionId}>{fieldState.error.message}</FieldError>
                ) : (
                  <FieldDescription id={urlDescriptionId}>{TENDERLY_URL_HELPER_TEXT}</FieldDescription>
                )}
              </div>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={EnvVariablesField.tenderlyToken} className={cn('gap-1.5', tokenError && 'text-destructive')}>
            Tenderly access token
          </Label>
          <Controller
            name={EnvVariablesField.tenderlyToken}
            control={control}
            rules={{
              validate: (value) => !getValues(EnvVariablesField.tenderlyURL) || !!value || TENDERLY_TOKEN_ERROR,
            }}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id={EnvVariablesField.tenderlyToken}
                    value={field.value || ''}
                    placeholder={TENDERLY_TOKEN_PLACEHOLDER}
                    aria-invalid={fieldState.invalid || undefined}
                    aria-describedby={fieldState.error ? tokenErrorId : undefined}
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    className={isTokenVisible ? undefined : '[-webkit-text-security:disc]'}
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <InputGroupButton
                            size="icon-sm"
                            onClick={() => setIsTokenVisible((visible) => !visible)}
                            aria-label={tokenVisibilityLabel}
                            data-testid="tenderly-token-visibility"
                          >
                            {isTokenVisible ? <EyeOffIcon /> : <EyeIcon />}
                          </InputGroupButton>
                        }
                      />
                      <TooltipContent>{tokenVisibilityLabel}</TooltipContent>
                    </Tooltip>
                    {showResetTokenButton && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <InputGroupButton size="icon-sm" onClick={onResetToken} aria-label="Reset to default value">
                              <RotateCcwIcon />
                            </InputGroupButton>
                          }
                        />
                        <TooltipContent>Reset to default value</TooltipContent>
                      </Tooltip>
                    )}
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.error && <FieldError id={tokenErrorId}>{fieldState.error.message}</FieldError>}
              </div>
            )}
          />
        </div>
      </div>
    </>
  )
}

export default TenderlySection
