import type { ReactElement } from 'react'
import { Controller, type Control } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { CookieAndTermType } from '@/store/cookiesAndTermsSlice'

type CookieFormData = {
  [CookieAndTermType.TERMS]: boolean
  [CookieAndTermType.NECESSARY]: boolean
  [CookieAndTermType.UPDATES]: boolean
  [CookieAndTermType.ANALYTICS]: boolean
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
  <Label htmlFor={id} className="gap-2">
    <Checkbox id={id} aria-label={label} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    {label}
  </Label>
)

const CookieOptionsList = ({ control }: { control: Control<CookieFormData> }): ReactElement => {
  return (
    <div className="flex-1">
      <div className="mb-2">
        <CookieCheckbox id="necessary" disabled label="Necessary" checked />
        <Typography variant="paragraph-small">Locally stored data for core functionality</Typography>
      </div>

      <div className="mb-2">
        <Controller
          name={CookieAndTermType.UPDATES}
          control={control}
          render={({ field }) => (
            <CookieCheckbox id="beamer" label="Beamer" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Typography variant="paragraph-small">New features and product announcements</Typography>
      </div>

      <div>
        <Controller
          name={CookieAndTermType.ANALYTICS}
          control={control}
          render={({ field }) => (
            <CookieCheckbox id="ga" label="Analytics" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Typography variant="paragraph-small">Analytics tools to understand usage patterns.</Typography>
      </div>
    </div>
  )
}

export default CookieOptionsList
