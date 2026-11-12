'use client'

import { useEffect, useMemo, useState } from 'react'
import { Callout } from 'fumadocs-ui/components/callout'
import { Button } from '@safe-global/ui/button'
import { Checkbox } from '@safe-global/ui/checkbox'
import { Label } from '@safe-global/ui/label'
import { RadioGroup, RadioGroupItem } from '@safe-global/ui/radio-group'
import { cn } from '@safe-global/ui/utils'
import {
  buildCreateOutput,
  FRAMEWORKS,
  INSTALL_PATHS,
  NPM_NOT_PUBLISHED,
  PRESETS,
  type Framework,
  type InstallPath,
} from '@/lib/create'
import { resolveRegistryUrl } from '@/lib/env'
import { Code } from '../site/code'

export interface CreateComponent {
  name: string
  title: string
  exports: string[]
}

const DEFAULT_SELECTION = ['button', 'card', 'dialog', 'input', 'tooltip', 'typography']

function Step({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 flex items-center gap-3 text-lg font-semibold">
        <span className="brand-mark grid size-6 place-items-center rounded-full text-xs">{index}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function OptionCards<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string
  label: string
  value: T
  options: Array<{ value: T; label: string; description: string }>
  onChange: (value: T) => void
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className="grid gap-3 sm:grid-cols-2"
      aria-label={label}
    >
      {options.map((option) => (
        <Label
          key={option.value}
          htmlFor={`${name}-${option.value}`}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
            value === option.value ? 'border-foreground/40 bg-muted/60' : 'hover:bg-muted/40',
          )}
        >
          <RadioGroupItem
            id={`${name}-${option.value}`}
            value={option.value}
            aria-labelledby={`${name}-${option.value}-label`}
            aria-describedby={`${name}-${option.value}-description`}
          />
          <span className="flex flex-col gap-1">
            <span id={`${name}-${option.value}-label`} className="font-medium">
              {option.label}
            </span>
            <span id={`${name}-${option.value}-description`} className="text-sm font-normal text-muted-foreground">
              {option.description}
            </span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  )
}

export function CreateProject({ components }: { components: CreateComponent[] }) {
  const [framework, setFramework] = useState<Framework>('vite')
  const [installPath, setInstallPath] = useState<InstallPath>('registry')
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTION)
  const [registryUrl, setRegistryUrl] = useState(() => resolveRegistryUrl({}))

  useEffect(() => {
    setRegistryUrl(resolveRegistryUrl({ origin: window.location.origin }))
  }, [])

  const exportsByComponent = useMemo(
    () => Object.fromEntries(components.map((component) => [component.name, component.exports])),
    [components],
  )
  const blocks = buildCreateOutput({ framework, installPath, components: selected, registryUrl, exportsByComponent })
  const allSelected = selected.length === components.length

  const toggle = (name: string, checked: boolean) =>
    setSelected((current) => (checked ? [...new Set([...current, name])] : current.filter((item) => item !== name)))
  const applyPreset = (names: string[]) => setSelected((current) => [...new Set([...current, ...names])])

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-create>
      <div className="flex flex-col gap-10">
        <Step index={1} title="Framework">
          <OptionCards
            name="framework"
            label="Framework"
            value={framework}
            options={FRAMEWORKS}
            onChange={setFramework}
          />
        </Step>
        <Step index={2} title="Install path">
          <OptionCards
            name="install-path"
            label="Install path"
            value={installPath}
            options={INSTALL_PATHS}
            onChange={setInstallPath}
          />
        </Step>
        <Step index={3} title="Components">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={allSelected ? 'secondary' : 'outline'}
              onClick={() => setSelected(allSelected ? [] : components.map((component) => component.name))}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </Button>
            {Object.entries(PRESETS).map(([preset, names]) => (
              <Button key={preset} size="sm" variant="ghost" onClick={() => applyPreset(names)} data-preset={preset}>
                + {preset}
              </Button>
            ))}
            <span className="ms-auto text-sm text-muted-foreground" data-selected-count>
              {selected.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border p-4 sm:grid-cols-3">
            {components.map((component) => (
              <div key={component.name} className="flex items-center gap-2">
                <Checkbox
                  id={`create-${component.name}`}
                  checked={selected.includes(component.name)}
                  onCheckedChange={(checked) => toggle(component.name, checked === true)}
                  aria-labelledby={`create-${component.name}-label`}
                />
                <Label
                  id={`create-${component.name}-label`}
                  htmlFor={`create-${component.name}`}
                  className="font-normal"
                >
                  {component.title}
                </Label>
              </div>
            ))}
          </div>
        </Step>
      </div>
      <div className="flex flex-col gap-4 lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:self-start">
        <h2 className="m-0 text-lg font-semibold">Your setup</h2>
        <p className="m-0 text-sm text-muted-foreground">
          Run these in order. The theme expects DM Sans: load it in your app (weights 400, 600 and 700).
        </p>
        {installPath === 'npm' ? (
          <Callout type="warn" className="my-0" data-npm-note>
            {NPM_NOT_PUBLISHED}
          </Callout>
        ) : null}
        {blocks.map((block) => (
          <div key={block.id} data-output={block.id}>
            <Code code={block.code} lang={block.lang} title={block.title} />
          </div>
        ))}
      </div>
    </div>
  )
}
