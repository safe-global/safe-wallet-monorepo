import type { ReactElement } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useCloudCosignerInfo } from '../../hooks/useCloudCosignerInfo'
import { CLOUD_COSIGNER_DESCRIPTION, CLOUD_COSIGNER_NAME } from '../../constants'

export type CloudCosignerOptionProps = {
  checked: boolean
  onCheckedChange: (checked: boolean, cosignerAddress: string) => void
  disabled?: boolean
  id?: string
}

/**
 * Opt-in control for adding the cloud cosigner as an extra owner. Renders nothing when the
 * feature is off for the chain or no service is configured, so callers can mount it
 * unconditionally.
 */
const CloudCosignerOption = ({
  checked,
  onCheckedChange,
  disabled = false,
  id = 'cloud-cosigner-option',
}: CloudCosignerOptionProps): ReactElement | null => {
  const { isAvailable, address, isLoading, error } = useCloudCosignerInfo()

  if (!isAvailable) {
    return null
  }

  if (isLoading) {
    return <Skeleton data-testid="cloud-cosigner-option-loading" className="h-16 w-full" />
  }

  if (error || !address) {
    return (
      <Alert variant="warning" data-testid="cloud-cosigner-option-error">
        <AlertSeverityIcon variant="warning" />
        <AlertDescription>
          The cloud cosigner is currently unavailable. You can add it later in Settings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Field orientation="horizontal" data-testid="cloud-cosigner-option" data-disabled={disabled || undefined}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true, address)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>Add {CLOUD_COSIGNER_NAME.toLowerCase()}</FieldLabel>
        <FieldDescription>{CLOUD_COSIGNER_DESCRIPTION}</FieldDescription>
        {checked && (
          <div data-testid="cloud-cosigner-option-address" className="pt-1">
            <EthHashInfo address={address} name={CLOUD_COSIGNER_NAME} shortAddress={false} showCopyButton hasExplorer />
          </div>
        )}
      </FieldContent>
    </Field>
  )
}

export default CloudCosignerOption
