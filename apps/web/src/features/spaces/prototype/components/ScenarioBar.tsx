import { useState } from 'react'
import { Check, Copy, FlaskConical } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@safe-global/views/components/ui/select'
import { ALL_FAILED } from '../services/queue'
import type { Direction, Persona, QueueState, Scenario } from '../types'
import { Badge } from '@safe-global/views/components/ui/badge'
import { FAMILY_LABELS, getPersonaLabel, PERSONAS } from '../services/personas'
import { getScenario, getScenarioAccounts, shortAddress } from '../services/model'
import { PixelAvatar } from './PixelAvatar'
import { getPersonaAddress, getSignerStatus, getWorkspaceProfile } from '../services/workspace'

// Workspace sizes. From 20 Safes up, each one has every transaction type, recoveries and conflicts.
export const SCENARIOS: { value: Scenario; label: string }[] = [
  { value: '1-safe', label: '1 Safe' },
  { value: '5-safes', label: '5 Safes' },
  { value: '10-safes', label: '10 Safes' },
  { value: '20-safes', label: '20 Safes' },
  { value: '50-safes', label: '50 Safes' },
]
// Hidden fixtures: old links and tests still open them.
const HIDDEN_SCENARIOS: Scenario[] = ['everyday', 'realistic', 'conflict', 'conflict-heavy']
const SCENARIO_LABELS = [...SCENARIOS, ...HIDDEN_SCENARIOS.map((value) => ({ value, label: 'Earlier fixture' }))]
export const STATES: { value: QueueState; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'loading', label: 'Loading' },
  { value: 'error', label: 'Failed to load' },
  { value: 'empty', label: 'Empty workspace' },
  { value: 'partial', label: 'Partial loading' },
  { value: 'executing', label: 'Executing' },
  { value: 'capped', label: 'Over 500 transactions' },
  { value: 'incoming', label: 'New proposal arrives' },
]
export const DEFAULT_SCENARIO: Scenario = '5-safes'
export const parseScenario = (query: { scenario?: unknown; state?: unknown }) => {
  const value = typeof query.scenario === 'string' ? query.scenario : ''
  const known = [...SCENARIOS.map((item) => item.value), ...HIDDEN_SCENARIOS].find((item) => item === value)
  const state = STATES.find((item) => item.value === query.state)?.value ?? 'normal'
  return { scenario: known ?? DEFAULT_SCENARIO, state }
}
const describeScenario = (scenario: Scenario) => {
  const count = getScenario(scenario).length
  return `${count} ${count === 1 ? 'transaction' : 'transactions'}`
}

export type Hypernative = 'in' | 'out' | 'none'

const personas = Object.keys(PERSONAS) as Persona[]
const PRIORITY_GROUPS = [
  { priority: 'primary', label: 'Primary personas' },
  { priority: 'secondary', label: 'Secondary personas' },
] as const

function WorkspaceHeader({ scenario }: { scenario: Scenario }) {
  const { segment, plan, safes, members, signers, outside } = getWorkspaceProfile(scenario)
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-popover px-3 pt-2 pb-3">
      <p className="text-sm font-medium text-foreground">Acme Inc · {plan.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{segment}</p>
      <p className="text-xs text-muted-foreground">
        {plan.seats ? `${safes} of ${plan.seats} Safe seats` : `${safes} Safes`} · {members} members · {signers} signers
        {outside ? `, ${outside} not in workspace` : ''}
      </p>
    </div>
  )
}

function PersonaList({ title, items }: { title: string; items: string[] }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground">{title}</span>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </span>
  )
}

function PersonaCard({ persona, scenario }: { persona: Persona; scenario: Scenario }) {
  const { name, role, family, priority, admin, jtbd, jobs, pains } = PERSONAS[persona]
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-3 whitespace-normal">
      <span className="flex items-center gap-3">
        <PixelAvatar persona={persona} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">
            {name} · {role}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={priority === 'primary' ? 'info' : 'outline'}>{FAMILY_LABELS[family]}</Badge>
            <span>
              {admin ? 'Admin' : 'Member'} · {getSignerStatus(persona, getScenarioAccounts(scenario))}
            </span>
          </span>
          <span className="font-mono text-xs text-muted-foreground">{shortAddress(getPersonaAddress(persona))}</span>
        </span>
      </span>
      <span className="text-xs italic">“{jtbd}”</span>
      <PersonaList title="Jobs to be done" items={jobs} />
      <PersonaList title="Pain points" items={pains} />
    </span>
  )
}

export const FAILED_COUNTS = [1, 3, 4, 5] as const
const FAILED_LABELS = {
  '1': '1 Safe failed',
  '3': '3 Safes failed',
  '4': '4 Safes failed',
  '5': '5 Safes failed',
  all: 'All Safes failed',
}
export type LoadReason = 'error' | 'limit'
const LOAD_REASONS: Record<LoadReason, string> = { error: "Couldn't load", limit: 'Over the 100-Safe limit' }
export const UNDEPLOYED_COUNTS = [0, 1, 2] as const
const UNDEPLOYED_LABELS = { '0': 'All deployed', '1': '1 not deployed', '2': '2 not deployed' }

export function ScenarioBar({
  direction,
  scenario,
  state,
  hypernative,
  persona,
  failedCount,
  loadReason,
  undeployedCount,
  onChange,
}: {
  failedCount: number
  loadReason: LoadReason
  undeployedCount: number
  state: QueueState
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
        <Tabs
          className="min-w-0 max-w-full"
          value={direction}
          onValueChange={(value) => onChange({ option: String(value) })}
        >
          <TabsList aria-label="Design direction" className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="flat">D · Flat table</TabsTrigger>
            <TabsTrigger value="cards">E · Group cards</TabsTrigger>
          </TabsList>
        </Tabs>
        {state === 'partial' && (
          <>
            <Select
              value={failedCount >= ALL_FAILED ? 'all' : String(failedCount)}
              items={FAILED_LABELS}
              onValueChange={(value) => value && onChange({ failed: value })}
            >
              <SelectTrigger size="sm" variant="ghost" aria-label="Safes that fail to load">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-(--anchor-width)">
                {Object.entries(FAILED_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={loadReason}
              items={LOAD_REASONS}
              onValueChange={(value) => value && onChange({ reason: value })}
            >
              <SelectTrigger size="sm" variant="ghost" aria-label="Why Safes didn't load">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-(--anchor-width)">
                {Object.entries(LOAD_REASONS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(undeployedCount)}
              items={UNDEPLOYED_LABELS}
              onValueChange={(value) => value && onChange({ undeployed: value })}
            >
              <SelectTrigger size="sm" variant="ghost" aria-label="Safes not deployed yet">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-auto min-w-(--anchor-width)">
                {Object.entries(UNDEPLOYED_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="scenario">
            Scenario
          </label>
          <Select
            value={scenario}
            items={SCENARIO_LABELS}
            onValueChange={(value) => value && onChange({ scenario: value })}
          >
            <SelectTrigger id="scenario" size="sm" variant="ghost" aria-label="Scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-(--anchor-width)">
              {SCENARIOS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="flex w-full items-center justify-between gap-4">
                    {item.label}
                    <span className="text-xs text-muted-foreground">{describeScenario(item.value)}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="sr-only" htmlFor="queue-state">
            State
          </label>
          <Select value={state} items={STATES} onValueChange={(value) => value && onChange({ state: value })}>
            <SelectTrigger id="queue-state" size="sm" variant="ghost" aria-label="State">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-auto min-w-(--anchor-width)">
              {STATES.map((item) => (
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
            items={Object.fromEntries(personas.map((value) => [value, getPersonaLabel(value)]))}
            onValueChange={(value) => value && onChange({ persona: value })}
          >
            <SelectTrigger id="persona" size="sm" variant="ghost" aria-label="Preview as">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              side="top"
              align="end"
              alignItemWithTrigger={false}
              className="w-[44rem] max-w-[calc(100vw-2rem)]"
            >
              <WorkspaceHeader scenario={scenario} />
              {PRIORITY_GROUPS.map(({ priority, label }) => (
                <div key={priority} className="pt-3">
                  <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {personas
                      .filter((value) => PERSONAS[value].priority === priority)
                      .map((value) => (
                        <SelectItem key={value} value={value} className="items-start rounded-md p-4 pr-8">
                          <PersonaCard persona={value} scenario={scenario} />
                        </SelectItem>
                      ))}
                  </div>
                </div>
              ))}
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
