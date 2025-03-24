import { useGetSafeQuery } from '@safe-global/store/gateway'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Settings } from './Settings'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useCallback, useState } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'

export const SettingsContainer = () => {
  const { chainId, address } = useDefinedActiveSafe()
  const { data = {} as SafeState } = useGetSafeQuery({
    chainId: chainId,
    safeAddress: address,
  })
  const contact = useAppSelector(selectContactByAddress(address))
  const [displayDevMenu, setDisplayDevMenu] = useState(false)
  const [tappedCount, setTappedCount] = useState(0)
  const onImplementationTap = useCallback(() => {
    setTappedCount((count) => count + 1)
    if (tappedCount >= 2) {
      setDisplayDevMenu(true)
    }
  }, [tappedCount, setTappedCount, setDisplayDevMenu])

  return (
    <Settings
      address={address}
      data={data}
      displayDevMenu={displayDevMenu}
      onImplementationTap={onImplementationTap}
      contact={contact}
    />
  )
}
