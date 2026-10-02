import type { ReactElement } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { SafenetCheckOutcome, SafenetScenario, SafenetScenarioTiming } from '../types'
import { useSafenetScenario } from '../useSafenetScenario'

const ROLE_OPTIONS: Array<{ value: SafenetScenario['role']; label: string }> = [
  { value: 'auto', label: 'From the tx flow' },
  { value: 'first-signer', label: 'First signer' },
  { value: 'co-signer', label: 'Co-signer' },
  { value: 'executor', label: 'Executor' },
  { value: 'final-signer', label: 'Last signer (meets the threshold)' },
]

const OUTCOME_OPTIONS: Array<{ value: SafenetCheckOutcome; label: string }> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'checking', label: 'Checking' },
  { value: 'no-issues', label: 'No issues found' },
  { value: 'risk', label: 'Risk detected' },
  { value: 'unavailable', label: 'Unavailable' },
]

const TIMING_OPTIONS: Array<{ value: SafenetScenarioTiming; label: string }> = [
  { value: 'instant', label: 'Instant' },
  { value: 'about-60s', label: 'About 60 seconds' },
  { value: 'never', label: 'Never resolves' },
]

type ScenarioSelectProps<T extends string> = {
  id: string
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

const ScenarioSelect = <T extends string>({ id, label, value, options, onChange }: ScenarioSelectProps<T>) => (
  <Field>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <Select items={options} value={value} onValueChange={(next) => next && onChange(next as T)}>
      <SelectTrigger id={id} data-testid={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </Field>
)

export type SafenetScenarioDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Dev-only controls for the mocked Safenet check every prototype surface reads. */
export const SafenetScenarioDialog = ({ open, onOpenChange }: SafenetScenarioDialogProps): ReactElement => {
  const { scenario, updateScenario, restartCheck } = useSafenetScenario()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader divided>
          <DialogTitle className="font-bold">Safenet scenarios</DialogTitle>
          <DialogDescription>
            Mock data for the Safenet checks prototype. Every change restarts the check, as if the first signature was
            just submitted.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="p-4">
          <ScenarioSelect
            id="safenet-scenario-role"
            label="Role"
            value={scenario.role}
            options={ROLE_OPTIONS}
            onChange={(role) => updateScenario({ role })}
          />
          <ScenarioSelect
            id="safenet-scenario-outcome"
            label="Result"
            value={scenario.outcome}
            options={OUTCOME_OPTIONS}
            onChange={(outcome) => updateScenario({ outcome })}
          />
          <ScenarioSelect
            id="safenet-scenario-timing"
            label="Timing"
            value={scenario.timing}
            options={TIMING_OPTIONS}
            onChange={(timing) => updateScenario({ timing })}
          />
          <Field orientation="horizontal">
            <Switch
              id="safenet-scenario-enhanced"
              checked={scenario.enhancedExecution}
              onCheckedChange={(enhancedExecution) => updateScenario({ enhancedExecution })}
            />
            <FieldLabel htmlFor="safenet-scenario-enhanced">Enhanced execution</FieldLabel>
          </Field>
        </FieldGroup>

        <DialogFooter divided className="flex-row items-center">
          <Button variant="outline" size="lg" onClick={restartCheck}>
            <RotateCcw />
            Restart check
          </Button>
          <DialogClose render={<Button size="lg" className="ml-auto" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SafenetScenarioDialog
