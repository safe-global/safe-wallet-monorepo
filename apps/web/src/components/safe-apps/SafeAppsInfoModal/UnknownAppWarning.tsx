import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import Domain from './Domain'

type UnknownAppWarningProps = {
  url?: string
  onHideWarning?: (hideWarning: boolean) => void
}

const UnknownAppWarning = ({ url, onHideWarning }: UnknownAppWarningProps): React.ReactElement => {
  const [toggleHideWarning, setToggleHideWarning] = useState(false)

  const handleToggleWarningPreference = (): void => {
    onHideWarning?.(!toggleHideWarning)
    setToggleHideWarning(!toggleHideWarning)
  }

  return (
    <div className="flex h-full flex-col items-center">
      <div className="mt-12 block items-center">
        <TriangleAlert className="size-9 text-[var(--color-warning-main)]" />
        <Typography variant="h3" className="mt-4 text-[var(--color-warning-main)]">
          Warning
        </Typography>
      </div>
      <Typography variant="paragraph-bold" className="my-4 text-[var(--color-warning-main)]">
        The application you are trying to access is not in the default Safe Apps list
      </Typography>

      <Typography className="my-4 text-center">
        Check the link you are using and ensure that it comes from a source you trust
      </Typography>

      {url && <Domain url={url} showInOneLine />}

      {onHideWarning && (
        <div className="mt-4">
          <Field orientation="horizontal">
            <Checkbox
              id="hide-warning"
              name="Warning message preference"
              checked={toggleHideWarning}
              onCheckedChange={handleToggleWarningPreference}
            />
            <FieldLabel htmlFor="hide-warning" className="font-normal">
              Don&apos;t show this warning again
            </FieldLabel>
          </Field>
        </div>
      )}
    </div>
  )
}

export default UnknownAppWarning
