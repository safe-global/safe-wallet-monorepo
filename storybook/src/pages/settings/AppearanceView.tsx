import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'

export type AppearanceViewProps = {
  darkModeId: string
  isDarkMode: boolean
  onDarkModeToggle: (checked: boolean) => void
}

export const AppearanceView = ({ darkModeId, isDarkMode, onDarkModeToggle }: AppearanceViewProps) => {
  return (
    <main>
      <div className="rounded-lg bg-[var(--color-background-paper)] p-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <Typography variant="h4">Theme</Typography>
          </div>

          <div>
            <Field orientation="horizontal">
              <Switch id={darkModeId} checked={isDarkMode} onCheckedChange={onDarkModeToggle} />
              <FieldLabel htmlFor={darkModeId}>Dark mode</FieldLabel>
            </Field>
          </div>
        </div>
      </div>
    </main>
  )
}
