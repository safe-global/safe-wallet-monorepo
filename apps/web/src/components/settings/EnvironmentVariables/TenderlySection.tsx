import { Controller, useFormContext } from 'react-hook-form'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { RotateCcwIcon } from 'lucide-react'
import InfoIcon from '@/public/images/notifications/info.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { TENDERLY_SIMULATE_ENDPOINT_URL } from '@safe-global/utils/config/constants'
import { EnvVariablesField } from './index'

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
  const { control } = useFormContext()

  return (
    <>
      <Typography variant="paragraph-bold" className="mb-4 mt-6 flex items-center">
        Tenderly
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <InfoIcon className="ml-1 size-4 align-middle text-muted-foreground" />
              </span>
            }
          />
          <TooltipContent>
            You can use your own Tenderly project to keep track of all your transaction simulations.{' '}
            <ExternalLink
              color="secondary"
              href="https://docs.tenderly.co/simulations-and-forks/simulation-api/configuration-of-api-access"
            >
              Read more
            </ExternalLink>
          </TooltipContent>
        </Tooltip>
      </Typography>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={EnvVariablesField.tenderlyURL}>Tenderly API URL</Label>
          <Controller
            name={EnvVariablesField.tenderlyURL}
            control={control}
            render={({ field }) => (
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id={EnvVariablesField.tenderlyURL}
                  value={field.value || ''}
                  type="url"
                  placeholder={TENDERLY_SIMULATE_ENDPOINT_URL}
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
                <InputGroupInput {...field} id={EnvVariablesField.tenderlyToken} value={field.value || ''} />
                {showResetTokenButton && (
                  <InputGroupAddon align="inline-end">
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
                  </InputGroupAddon>
                )}
              </InputGroup>
            )}
          />
        </div>
      </div>
    </>
  )
}

export default TenderlySection
