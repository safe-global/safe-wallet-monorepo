import { type ReactElement } from 'react'
import { Switch } from '@safe-global/design-system/components/switch'
import { Field } from '@safe-global/design-system/components/field'
import { Label } from '@safe-global/design-system/components/label'
import { TX_LIST_EVENTS } from '@/services/analytics'
import Track from '@/components/common/Track'

const _TrustedToggleButton = ({
  onlyTrusted,
  setOnlyTrusted,
  hasDefaultTokenlist,
}: {
  onlyTrusted: boolean
  setOnlyTrusted: (on: boolean) => void
  hasDefaultTokenlist?: boolean
}): ReactElement | null => {
  if (!hasDefaultTokenlist) {
    return null
  }

  return (
    <Track {...TX_LIST_EVENTS.TOGGLE_UNTRUSTED} label={onlyTrusted ? 'show' : 'hide'}>
      <Field orientation="horizontal" className="h-10 w-fit items-center gap-2" data-testid="toggle-untrusted">
        <Switch id="toggle-untrusted" checked={onlyTrusted} onCheckedChange={setOnlyTrusted} />
        <Label htmlFor="toggle-untrusted">Hide suspicious</Label>
      </Field>
    </Track>
  )
}

export default _TrustedToggleButton
