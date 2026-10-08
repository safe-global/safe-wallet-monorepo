import type { ReactElement } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'

export type CookieOption = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export type CookieOptionsListViewProps = {
  updates: CookieOption
  analytics: CookieOption
}

const CookieCheckbox = ({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
}) => (
  <Label htmlFor={id} className="text-base">
    <Checkbox id={id} aria-label={label} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    {label}
  </Label>
)

export function CookieOptionsListView({ updates, analytics }: CookieOptionsListViewProps): ReactElement {
  return (
    <div className="flex-1">
      <div className="mb-4">
        <CookieCheckbox id="necessary" disabled label="Necessary" checked />
        <Typography variant="paragraph-small">Locally stored data for core functionality</Typography>
      </div>

      <div className="mb-4">
        <CookieCheckbox
          id="beamer"
          label="Beamer"
          checked={updates.checked}
          onCheckedChange={updates.onCheckedChange}
        />
        <Typography variant="paragraph-small">New features and product announcements</Typography>
      </div>

      <div>
        <CookieCheckbox
          id="ga"
          label="Analytics"
          checked={analytics.checked}
          onCheckedChange={analytics.onCheckedChange}
        />
        <Typography variant="paragraph-small">Analytics tools to understand usage patterns.</Typography>
      </div>
    </div>
  )
}
