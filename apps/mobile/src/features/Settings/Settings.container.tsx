import { useGetSafeQuery } from '@safe-global/store/gateway'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Settings } from './Settings'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useCallback, useState } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectContactByAddress } from '@/src/store/addressBookSlice'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { selectActiveChain } from '@/src/store/chains'
import { isValidMasterCopy, isMigrationToL2Possible } from '@safe-global/utils/services/contracts/safeContracts'

export const SettingsContainer = () => {
  const { chainId, address } = useDefinedActiveSafe()
  const chain = useAppSelector(selectActiveChain)
  const latestSafeVersion = getLatestSafeVersion(
    chain ? { chainId, recommendedMasterCopyVersion: chain.recommendedMasterCopyVersion } : undefined,
  )

  const { data = {} as SafeState } = useGetSafeQuery({
    chainId: chainId,
    safeAddress: address,
  })

  const isUnsupportedMasterCopy = !isValidMasterCopy(data.implementationVersionState) && isMigrationToL2Possible(data)

  const needsUpdate = data.implementationVersionState === 'OUTDATED'
  const isLatestVersion = data.version && !needsUpdate

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
      isLatestVersion={!!isLatestVersion}
      latestSafeVersion={latestSafeVersion}
      isUnsupportedMasterCopy={isUnsupportedMasterCopy}
    />
  )
}
