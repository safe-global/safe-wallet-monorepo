import type { ReactElement } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { TriangleAlert } from 'lucide-react'
import {
  FUNCTIONS_HELPER_TEXT,
  FUNCTIONS_LABEL,
  GUARD_LOCK_CONFIRM_LABEL,
  GUARD_LOCK_TEXT,
  GUARD_LOCK_TITLE,
  NO_FUNCTION_SELECTED_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import type { SafeManagementFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import { GUARD_CRITICAL_FUNCTION_IDS, SAFE_MANAGEMENT_FUNCTIONS } from '../contracts'

/** The nine management functions as toggles, plus the consent a missing guard change needs. */
const SafeManagementFields = (): ReactElement => {
  const { control, watch, setValue } = useFormContext<SafeManagementFormValues>()
  const functionIds = watch('functionIds') ?? []

  const toggle = (id: string, checked: boolean) => {
    const next = checked ? [...functionIds, id] : functionIds.filter((value) => value !== id)
    setValue('functionIds', next, { shouldValidate: true, shouldDirty: true })
    if (GUARD_CRITICAL_FUNCTION_IDS.every((id) => next.includes(id))) {
      setValue('guardLockConfirmed', false, { shouldValidate: true })
    }
  }

  const isGuardChangeLeftOut = !GUARD_CRITICAL_FUNCTION_IDS.every((id) => functionIds.includes(id))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="paragraph-bold">{FUNCTIONS_LABEL}</Typography>
        <Typography variant="paragraph-mini" color="muted">
          {FUNCTIONS_HELPER_TEXT}
        </Typography>
      </div>

      <div className="flex flex-col gap-3" role="group" aria-label={FUNCTIONS_LABEL}>
        {SAFE_MANAGEMENT_FUNCTIONS.map((fn) => (
          <div key={fn.id} className="flex items-start gap-3">
            <Checkbox
              id={`safe-management-${fn.id}`}
              checked={functionIds.includes(fn.id)}
              onCheckedChange={(checked) => toggle(fn.id, checked === true)}
              data-testid={`safe-management-${fn.id}`}
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor={`safe-management-${fn.id}`}>{fn.label}</Label>
              <Typography variant="paragraph-mini" color="muted">
                {fn.description}
              </Typography>
            </div>
          </div>
        ))}
      </div>

      {functionIds.length === 0 && (
        <Typography variant="paragraph-mini" className="text-destructive">
          {NO_FUNCTION_SELECTED_ERROR}
        </Typography>
      )}

      {isGuardChangeLeftOut && functionIds.length > 0 && (
        <Alert variant="warning" data-testid="guard-lock-warning">
          <TriangleAlert className="size-4" aria-hidden />
          <AlertTitle>{GUARD_LOCK_TITLE}</AlertTitle>
          <AlertDescription>
            <span className="mb-3 block">{GUARD_LOCK_TEXT}</span>
            <Controller
              control={control}
              name="guardLockConfirmed"
              render={({ field }) => (
                <span className="flex items-start gap-3">
                  <Checkbox
                    id="guard-lock-confirm"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    data-testid="guard-lock-confirm"
                  />
                  <Label htmlFor="guard-lock-confirm">{GUARD_LOCK_CONFIRM_LABEL}</Label>
                </span>
              )}
            />
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default SafeManagementFields
