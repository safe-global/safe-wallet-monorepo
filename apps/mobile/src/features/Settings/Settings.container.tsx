import { useGetSafeQuery } from '@safe-global/store/gateway'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { Settings } from './Settings'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export const SettingsContainer = () => {
  const { chainId, address } = useDefinedActiveSafe()
  const { data = {} as SafeState } = useGetSafeQuery({
    chainId: chainId,
    safeAddress: address,
  })

  return <Settings address={address} data={data} />
}
