import { useState } from 'react'
import { Check, Copy, FlaskConical } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@safe-global/views/components/ui/select'
import type { Direction, Persona, Scenario } from '../types'

export const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: 'everyday', label: 'Everyday queue' },
  { value: 'realistic', label: 'Realistic mix' },
  { value: 'conflict', label: 'Conflicting transactions' },
  { value: 'conflict-heavy', label: 'Many conflicting' },
  { value: 'conflict-mixed', label: 'Conflicts with mixed statuses' },
  { value: 'gap', label: 'Missing dependency' },
  { value: 'partial', label: 'Partial loading' },
  { value: 'recovery', label: 'Account recovery' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Failed to load' },
  { value: 'empty', label: 'Empty workspace' },
]

export type Hypernative = 'in' | 'out' | 'none'

export function ScenarioBar({
  direction,
  scenario,
  hypernative,
  persona,
  onChange,
}: {
  direction: Direction
  scenario: Scenario
  hypernative: Hypernative
  persona: Persona
  onChange: (changes: Record<string, string>) => void
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="border-t border-border px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FlaskConical className="size-4" />
          Preview · simulated
        </div>
        <Tabs value={direction} onValueChange={(value) => onChange({ option: String(value) })}>
          <TabsList aria-label="Design direction">
            <TabsTrigger value="queues">A · Safe queues</TabsTrigger>
            <TabsTrigger value="inbox">B · Action inbox</TabsTrigger>
            <TabsTrigger value="steps">C · Next steps</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="scenario">
            Scenario
          </label>
          <Select value={scenario} items={SCENARIOS} onValueChange={(value) => value && onChange({ scenario: value })}>
            <SelectTrigger id="scenario" size="sm" variant="ghost" aria-label="Scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-(--anchor-width)">
              {SCENARIOS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="sr-only" htmlFor="hypernative">
            Hypernative
          </label>
          <Select
            value={hypernative}
            items={{
              in: 'Hypernative · Connected',
              out: 'Hypernative · Not connected',
              none: 'Hypernative · Not eligible',
            }}
            onValueChange={(value) => value && onChange({ hn: value })}
          >
            <SelectTrigger id="hypernative" size="sm" variant="ghost" aria-label="Hypernative">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-(--anchor-width)">
              <SelectItem value="in">Hypernative · Connected</SelectItem>
              <SelectItem value="out">Hypernative · Not connected</SelectItem>
              <SelectItem value="none">Hypernative · Not eligible</SelectItem>
            </SelectContent>
          </Select>
          <label className="sr-only" htmlFor="persona">
            Preview as
          </label>
          <Select
            value={persona}
            items={{ owner: 'Dev · Signer', observer: 'Alex · Non-owner' }}
            onValueChange={(value) => value && onChange({ persona: value })}
          >
            <SelectTrigger id="persona" size="sm" variant="ghost" aria-label="Preview as">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-(--anchor-width)">
              <SelectItem value="owner">Dev · Signer</SelectItem>
              <SelectItem value="observer">Alex · Non-owner</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy this option link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                setCopied(true)
              } catch {
                setCopied(false)
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
      </div>
    </div>
  )
}
