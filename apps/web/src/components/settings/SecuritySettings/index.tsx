import { useAppDispatch, useAppSelector } from '@/store'
import { selectBlindSigning, setBlindSigning } from '@/store/settingsSlice'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Typography } from '@/components/ui/typography'
import SettingsCard from '../SettingsCard'

const SecuritySettings = () => {
  const isBlindSigningEnabled = useAppSelector(selectBlindSigning)
  const dispatch = useAppDispatch()

  return (
    <SettingsCard title="Security" titleClassName="mb-2">
      <Typography className="mb-4">
        Enabling this setting allows the signing of unreadable signature requests. Signing these messages can lead to
        unpredictable consequences, including the potential loss of funds or control over your account.
      </Typography>
      <Field orientation="horizontal" className="w-fit">
        <Checkbox
          id="blind-signing"
          checked={isBlindSigningEnabled}
          onCheckedChange={() => dispatch(setBlindSigning(!isBlindSigningEnabled))}
        />
        <FieldLabel htmlFor="blind-signing">Enable blind signing</FieldLabel>
      </Field>
    </SettingsCard>
  )
}

export default SecuritySettings
