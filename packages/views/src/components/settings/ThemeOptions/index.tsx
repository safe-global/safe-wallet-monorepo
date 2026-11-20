import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'

type ThemeOptionsProps<T extends string> = {
  options: readonly { value: T; label: string }[]
  current: T
  onChange: (value: T) => void
}

const ThemeOptions = <T extends string>({ options, current, onChange }: ThemeOptionsProps<T>) => {
  return (
    <div role="group" aria-label="Theme" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((opt) => {
        const isSelected = current === opt.value
        return (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            aria-pressed={isSelected}
            data-theme-option={opt.value}
            onClick={() => onChange(opt.value)}
            data-testid={`theme-card-${opt.value}`}
            className={cn(
              /* eslint-disable no-restricted-syntax -- theme option cards rendered as buttons; card sizing + selected-state bg pending a toggle/card pattern */
              'flex h-auto min-w-0 justify-start gap-2 whitespace-normal rounded-lg px-3 py-3 text-left font-normal',
              isSelected
                ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent dark:bg-accent dark:text-primary dark:hover:bg-accent'
                : 'bg-muted hover:bg-muted/70',
              /* eslint-enable no-restricted-syntax */
            )}
          >
            <span
              aria-hidden
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                isSelected ? 'border-sidebar-accent-foreground dark:border-primary' : 'border-muted-foreground',
              )}
            >
              {isSelected && <span className="h-2 w-2 rounded-full bg-sidebar-accent-foreground dark:bg-primary" />}
            </span>
            <Typography variant="paragraph-small-bold">{opt.label}</Typography>
          </Button>
        )
      })}
    </div>
  )
}

export default ThemeOptions
