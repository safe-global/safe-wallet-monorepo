import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SAFE_PRO_TERMS_URL } from '@/config/constants'
import { PRO_TRIAL_COPY } from './copy'
import { validateTrialDetails, type TrialDetails, type TrialDetailsErrors } from './trialDetails'

const EMPTY: TrialDetails = { email: '', name: '', company: '', acceptsTerms: false }

/** The short in-app step that replaces Stripe Checkout at trial start: no card, no price, and the billing email is kept. */
const TrialDetailsStep = ({
  title = PRO_TRIAL_COPY.trialDetails.title,
  backLabel = PRO_TRIAL_COPY.trialDetails.back,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: {
  title?: string
  backLabel?: string
  isSubmitting: boolean
  error?: boolean
  onBack: () => void
  onSubmit: (details: TrialDetails) => void
}) => {
  const [details, setDetails] = useState(EMPTY)
  const [errors, setErrors] = useState<TrialDetailsErrors>({})
  const set = (patch: Partial<TrialDetails>) => setDetails((current) => ({ ...current, ...patch }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = validateTrialDetails(details)
    setErrors(next)
    if (Object.keys(next).length === 0) onSubmit(details)
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6" data-testid="trial-details">
      <Typography variant="h3" as={DialogTitle}>
        {title}
      </Typography>

      <FieldGroup>
        <Field data-invalid={Boolean(errors.email) || undefined}>
          <FieldLabel htmlFor="trial-email">{PRO_TRIAL_COPY.trialDetails.email}</FieldLabel>
          <Input
            id="trial-email"
            type="email"
            autoComplete="email"
            value={details.email}
            aria-invalid={Boolean(errors.email) || undefined}
            onChange={(event) => set({ email: event.target.value })}
          />
          {errors.email ? (
            <FieldError>{errors.email}</FieldError>
          ) : (
            <FieldDescription>{PRO_TRIAL_COPY.trialDetails.emailHint}</FieldDescription>
          )}
        </Field>

        <Field data-invalid={Boolean(errors.name) || undefined}>
          <FieldLabel htmlFor="trial-name">{PRO_TRIAL_COPY.trialDetails.name}</FieldLabel>
          <Input
            id="trial-name"
            autoComplete="name"
            value={details.name}
            aria-invalid={Boolean(errors.name) || undefined}
            onChange={(event) => set({ name: event.target.value })}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="trial-company">
            {PRO_TRIAL_COPY.trialDetails.company}{' '}
            <Typography variant="paragraph-small" color="muted">
              {PRO_TRIAL_COPY.trialDetails.optional}
            </Typography>
          </FieldLabel>
          <Input
            id="trial-company"
            autoComplete="organization"
            value={details.company}
            onChange={(event) => set({ company: event.target.value })}
          />
        </Field>

        <Field orientation="horizontal" data-invalid={Boolean(errors.acceptsTerms) || undefined}>
          <Checkbox
            id="trial-terms"
            aria-labelledby="trial-terms-label"
            checked={details.acceptsTerms}
            aria-invalid={Boolean(errors.acceptsTerms) || undefined}
            onCheckedChange={(checked) => set({ acceptsTerms: checked === true })}
          />
          <FieldLabel id="trial-terms-label" htmlFor="trial-terms">
            <Link href={SAFE_PRO_TERMS_URL} target="_blank" rel="noopener noreferrer">
              {PRO_TRIAL_COPY.trialDetails.terms}
            </Link>
          </FieldLabel>
        </Field>
        {errors.acceptsTerms && <FieldError>{errors.acceptsTerms}</FieldError>}
      </FieldGroup>

      {error && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>{PRO_TRIAL_COPY.trialDetails.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          weight="semibold"
          accentIcon
          className="w-full"
          disabled={isSubmitting}
          data-testid="trial-details-submit"
        >
          {isSubmitting ? PRO_TRIAL_COPY.trialDetails.starting : PRO_TRIAL_COPY.trialDetails.submit}
          {!isSubmitting && <ArrowRight data-icon="inline-end" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          weight="semibold"
          className="w-full"
          onClick={onBack}
          disabled={isSubmitting}
        >
          {backLabel}
        </Button>
      </div>
    </form>
  )
}

export default TrialDetailsStep
