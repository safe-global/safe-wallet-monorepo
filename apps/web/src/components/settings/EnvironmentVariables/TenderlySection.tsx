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
import { EnvVariablesField, type EnvVariablesFormData } from './index'
import {
  isTenderlySimulateUrl,
  TENDERLY_SETUP_GUIDE_URL,
  TENDERLY_SIMULATE_URL_PLACEHOLDER,
  TENDERLY_URL_ERROR,
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
    formState: { errors },
  } = useFormContext<EnvVariablesFormData>()
  const { hasProFeatures, spaceId } = useSafeProAccess()
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const tokenVisibilityLabel = isTokenVisible ? 'Hide access token' : 'Show access token'
  const urlError = errors[EnvVariablesField.tenderlyURL]
  const urlDescriptionId = `${EnvVariablesField.tenderlyURL}-description`
  const plansHref = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces

  return (
    <>
      <Typography variant="paragraph-bold" className="mb-4 mt-6">
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

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={EnvVariablesField.tenderlyURL} className={urlError ? 'text-destructive' : undefined}>
            Tenderly API URL
          </Label>
          <Controller
            name={EnvVariablesField.tenderlyURL}
            control={control}
            rules={{ validate: (value) => !value || isTenderlySimulateUrl(value) || TENDERLY_URL_ERROR }}
            render={({ field, fieldState }) => (
              <>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id={EnvVariablesField.tenderlyURL}
                    value={field.value || ''}
                    type="url"
                    placeholder={TENDERLY_SIMULATE_URL_PLACEHOLDER}
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
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={EnvVariablesField.tenderlyToken}>Tenderly access token</Label>
          <Controller
            name={EnvVariablesField.tenderlyToken}
            control={control}
            render={({ field }) => (
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id={EnvVariablesField.tenderlyToken}
                  value={field.value || ''}
                  // A text field masked with CSS, not type="password", so browsers and password managers don't offer to
                  // save it as a password or autofill a saved one into it.
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
            )}
          />
        </div>
      </div>
    </>
  )
}

export default TenderlySection
