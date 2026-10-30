import { useId, type ReactElement, type Ref } from 'react'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Typography } from '@safe-global/views/components/ui/typography'
import { REVIEW_CONSENT_ERROR } from './constants'

export type AllowlistConsentProps = {
  label: string
  checked: boolean
  /** Set once the owner tried to continue without ticking the box */
  showError: boolean
  onCheckedChange: (checked: boolean) => void
  ref?: Ref<HTMLDivElement>
}

/** The owner's confirmation, on the review, that the allowlist blocks everything it doesn't allow */
const AllowlistConsent = ({ label, checked, showError, onCheckedChange, ref }: AllowlistConsentProps): ReactElement => {
  const checkboxId = useId()
  const labelId = useId()
  const isErrorShown = showError && !checked

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
      data-testid="allowlist-consent"
    >
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-3 px-1">
        <Checkbox
          id={checkboxId}
          aria-labelledby={labelId}
          aria-invalid={isErrorShown}
          checked={checked}
          onCheckedChange={(next) => onCheckedChange(next === true)}
          className="mt-0.5 bg-card"
        />
        <Typography id={labelId} variant="paragraph-small">
          {label}
        </Typography>
      </label>
      {isErrorShown && (
        <Typography variant="paragraph-small" className="px-1 text-destructive">
          {REVIEW_CONSENT_ERROR}
        </Typography>
      )}
    </div>
  )
}

export default AllowlistConsent
