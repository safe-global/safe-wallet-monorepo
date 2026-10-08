import { useAppDispatch, useAppSelector } from '@/store'
import { selectBlindSigning, setBlindSigning } from '@/store/settingsSlice'
import { SecuritySettingsView } from '@views/components/settings/SecuritySettings/SecuritySettingsView'

const SecuritySettings = () => {
  const isBlindSigningEnabled = useAppSelector(selectBlindSigning)
  const dispatch = useAppDispatch()

  return (
    <SecuritySettingsView
      isBlindSigningEnabled={isBlindSigningEnabled}
      onToggle={() => dispatch(setBlindSigning(!isBlindSigningEnabled))}
    />
  )
}

export default SecuritySettings
