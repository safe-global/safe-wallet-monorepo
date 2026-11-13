import { Fragment, useEffect, useId, useState, type ReactElement } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import { Label } from '@safe-global/views/components/ui/label'
import { Switch } from '@safe-global/views/components/ui/switch'
import { Typography } from '@safe-global/views/components/ui/typography'

export type ChoiceControl<Settings> = {
  [Key in keyof Settings]: {
    key: Key
    label: string
    /** Options with a `group` are listed under that heading. */
    options: { value: Settings[Key]; label: string; group?: string }[]
  }
}[keyof Settings]

export type SwitchControl<Settings> = { key: keyof Settings; label: string }

export type BarMode = 'expanded' | 'collapsed' | 'hidden'

/** The bar's height; the canvas leaves this much room above the panels while the bar is open. */
export const CONTROLS_BAR_HEIGHT = 40

const TOGGLE_KEY = '.'

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** "." hides and shows the bar, as in the Policies M2 prototype. */
export const useBarMode = (): [BarMode, (mode: BarMode) => void] => {
  const [mode, setMode] = useState<BarMode>('expanded')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== TOGGLE_KEY || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      setMode((current) => (current === 'hidden' ? 'expanded' : 'hidden'))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return [mode, setMode]
}

const ChoiceMenu = <Settings,>({
  control,
  value,
  onChange,
}: {
  control: ChoiceControl<Settings>
  value: Settings[keyof Settings]
  onChange: (value: Settings[keyof Settings]) => void
}): ReactElement => {
  const current = control.options.find((option) => option.value === value)
  const groups = control.options.reduce<{ heading?: string; options: typeof control.options }[]>((list, option) => {
    const last = list.at(-1)
    if (last && last.heading === option.group) last.options.push(option)
    else list.push({ heading: option.group, options: [option] })
    return list
  }, [])
  const select = (next: unknown) => {
    const option = control.options.find((candidate) => String(candidate.value) === next)
    if (option) onChange(option.value)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="xs" />}>
        <span className="text-muted-foreground">{control.label}:</span>
        {current?.label}
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[70vh] overflow-y-auto">
        {groups.map(({ heading, options }, index) => (
          <Fragment key={heading ?? index}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              {heading && <DropdownMenuLabel>{heading}</DropdownMenuLabel>}
              {/* One radio group per heading; only the chosen value's item is checked across all of them. */}
              <DropdownMenuRadioGroup value={String(value)} onValueChange={select}>
                {options.map((option) => (
                  <DropdownMenuRadioItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SwitchToggle = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}): ReactElement => {
  const id = useId()
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-xs font-normal">
        {label}
      </Label>
    </div>
  )
}

/** The Policies M2 prototype bar, holding the story's settings instead of Storybook's Controls panel. */
export const ControlsBar = <Settings extends Record<string, unknown>>({
  mode,
  onModeChange,
  settings,
  onChange,
  choices,
  switches,
}: {
  mode: BarMode
  onModeChange: (mode: BarMode) => void
  settings: Settings
  onChange: (settings: Settings) => void
  choices: ChoiceControl<Settings>[]
  switches: SwitchControl<Settings>[]
}): ReactElement | null => {
  if (mode === 'hidden') return null

  if (mode === 'collapsed') {
    return (
      <div className="fixed top-2 left-1/2 z-40 -translate-x-1/2">
        <Badge render={<button type="button" />} variant="warning" onClick={() => onModeChange('expanded')}>
          Controls
          <ChevronDown />
        </Badge>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 overflow-x-auto border-b border-border bg-card px-4 [scrollbar-width:none]"
      style={{ height: CONTROLS_BAR_HEIGHT }}
    >
      <Badge variant="warning" className="shrink-0">
        Prototype
      </Badge>

      {choices.map((control) => (
        <ChoiceMenu<Settings>
          key={String(control.key)}
          control={control}
          value={settings[control.key]}
          onChange={(value) => onChange({ ...settings, [control.key]: value })}
        />
      ))}

      {switches.map(({ key, label }) => (
        <SwitchToggle
          key={String(key)}
          label={label}
          checked={Boolean(settings[key])}
          onChange={(checked) => onChange({ ...settings, [key]: checked })}
        />
      ))}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Typography variant="paragraph-mini" color="muted" className="whitespace-nowrap">
          Press &quot;.&quot; to hide
        </Typography>
        <Button
          variant="ghost-muted"
          size="icon-sm"
          aria-label="Collapse controls"
          onClick={() => onModeChange('collapsed')}
        >
          <ChevronUp />
        </Button>
      </div>
    </div>
  )
}
