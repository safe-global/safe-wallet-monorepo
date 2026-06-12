import { type ReactElement } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { setDarkMode } from '@/store/settingsSlice'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { LS_KEY } from '@/config/gateway'

const DebugToggle = (): ReactElement => {
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()

  const [isProdGateway = false, setIsProdGateway] = useLocalStorage<boolean>(LS_KEY)

  const onToggleGateway = (checked: boolean) => {
    setIsProdGateway(checked)

    setTimeout(() => {
      location.reload()
    }, 300)
  }

  return (
    <div className="ml-4 flex flex-col gap-2 py-4">
      <Label className="gap-2">
        <Switch checked={isDarkMode} onCheckedChange={(checked) => dispatch(setDarkMode(checked))} />
        Dark mode
      </Label>
      <Label className="gap-2">
        <Switch checked={isProdGateway} onCheckedChange={onToggleGateway} />
        Use prod CGW
      </Label>
    </div>
  )
}

export default DebugToggle
