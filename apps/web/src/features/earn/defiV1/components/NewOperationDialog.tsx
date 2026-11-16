import { useState } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Input } from '@safe-global/views/components/ui/input'
import { Label } from '@safe-global/views/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Switch } from '@safe-global/views/components/ui/switch'
import { Typography } from '@safe-global/views/components/ui/typography'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount } from '../copy'
import type { Operation, Opportunity } from '../types'

const COPY = DEFI_V1_COPY.operations
const DEFAULT_BUDGET = 500_000

export const NewOperationDialog = ({
  open,
  options,
  onClose,
  onCreate,
}: {
  open: boolean
  options: Opportunity[]
  onClose: () => void
  onCreate: (operation: Operation) => void
}) => {
  const { safe } = useSafeInfo()
  const owners = safe.owners.length
  const [name, setName] = useState('')
  const [budget, setBudget] = useState(String(DEFAULT_BUDGET))
  const [threshold, setThreshold] = useState(1)
  const [allowed, setAllowed] = useState<string[]>([])
  const [refill, setRefill] = useState(false)
  const amount = Number(budget.replace(/[^0-9.]/g, '')) || 0
  const label = name.trim() || COPY.namePlaceholder
  const canSubmit = amount > 0 && allowed.length > 0

  const toggle = (id: string) =>
    setAllowed((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const submit = () => {
    onCreate({
      id: `operation-${Date.now()}`,
      name: label,
      budget: amount,
      invested: 0,
      threshold,
      owners,
      opportunityIds: allowed,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="sm" data-testid="new-operation-dialog">
        <DialogHeader divided="subtle">
          <DialogTitle>{COPY.newOperation}</DialogTitle>
          <DialogDescription>{COPY.dialogLead}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="operation-name">{COPY.name}</Label>
              <Input
                id="operation-name"
                value={name}
                maxLength={40}
                placeholder={COPY.namePlaceholder}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="operation-budget">{COPY.budget}</Label>
              <Input
                id="operation-budget"
                inputMode="decimal"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{COPY.who}</Label>
            <RadioGroup
              value={String(threshold)}
              onValueChange={(next) => setThreshold(Number(next))}
              className="grid-cols-3 gap-1.5"
            >
              {Array.from({ length: owners }, (_, index) => index + 1).map((count) => (
                <label
                  key={count}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm"
                >
                  <RadioGroupItem value={String(count)} />
                  {COPY.signers(count, owners)}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{COPY.allowed}</Label>
            <div className="flex flex-col gap-1 rounded-lg bg-card p-2">
              {options.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm">
                  <Checkbox checked={allowed.includes(option.id)} onCheckedChange={() => toggle(option.id)} />
                  <span className="flex-1">{option.name}</span>
                  <span className="text-xs text-muted-foreground">{option.exitShort}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
            <Badge variant="warning" className="w-fit">
              {COPY.later}
            </Badge>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <Typography variant="paragraph-small-medium">{COPY.refill}</Typography>
                <Typography variant="paragraph-mini" color="muted">
                  {COPY.refillHint}
                </Typography>
              </div>
              <Switch checked={refill} onCheckedChange={setRefill} aria-label={COPY.refill} />
            </div>
            <Typography variant="paragraph-small" color="muted">
              {COPY.lockMain}
            </Typography>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{COPY.steps}</Label>
            <ol className="flex list-decimal flex-col gap-1 rounded-lg bg-card py-2 pr-3 pl-8 text-sm">
              <li>{COPY.stepCreate(label)}</li>
              <li>{COPY.stepMove(formatAmount(amount))}</li>
            </ol>
          </div>
        </div>
        <DialogFooter divided="subtle">
          <Typography variant="paragraph-small" color="muted" align="center">
            {COPY.approveOnce(safe.threshold, owners)}
          </Typography>
          <Button size="lg" disabled={!canSubmit} onClick={submit}>
            {COPY.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
