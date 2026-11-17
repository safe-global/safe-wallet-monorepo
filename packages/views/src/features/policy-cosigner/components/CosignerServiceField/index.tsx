import type { ChangeEventHandler, FocusEventHandler, ReactElement } from 'react'
import { RotateCcwIcon } from 'lucide-react'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@safe-global/views/components/ui/input-group'

export type CosignerServiceFieldProps = {
  name: string
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  onReset: () => void
  showResetButton: boolean
  /** The URL used when the field is empty, from the app's build configuration */
  defaultUrl?: string
  chainName?: string
}

const CosignerServiceField = ({
  name,
  value,
  onChange,
  onBlur,
  onReset,
  showResetButton,
  defaultUrl,
  chainName,
}: CosignerServiceFieldProps): ReactElement => (
  <>
    <Typography variant="paragraph-bold" className="mb-2 mt-6">
      Co-signer service
    </Typography>

    <Alert variant="info" className="mb-3" data-testid="cosigner-service-info">
      <AlertSeverityIcon variant="info" />
      <AlertDescription>
        Fetches co-signatures for Safes protected by a policy guard{chainName ? ` on ${chainName}` : ''}. Leave empty to{' '}
        {defaultUrl ? 'use the default service' : 'turn co-signing off on this network'}.
      </AlertDescription>
    </Alert>

    <InputGroup>
      <InputGroupInput
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        type="url"
        placeholder={defaultUrl ?? 'https://'}
        data-testid="cosigner-service-input"
      />
      {showResetButton && (
        <InputGroupAddon align="inline-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <InputGroupButton size="icon-sm" onClick={onReset} aria-label="Reset to default value">
                  <RotateCcwIcon />
                </InputGroupButton>
              }
            />
            <TooltipContent>Reset to default value</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      )}
    </InputGroup>
  </>
)

export default CosignerServiceField
