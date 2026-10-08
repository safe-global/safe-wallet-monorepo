import type { SettingsChangeTransaction as SettingsChangeType } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SettingsInfoType } from '@safe-global/store/gateway/types'
import type { NarrowConfirmationViewProps } from '../types'
import { OwnerList } from '@/components/tx-flow/common/OwnerList'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ChangeSignerSetupWarning } from '@/features/multichain'
import { useContext } from 'react'
import { SettingsChangeContext } from '@/components/tx-flow/flows/AddOwner/context'
import { SettingsChangeView } from '@views/components/tx/confirmation-views/SettingsChange/SettingsChangeView'

export interface SettingsChangeProps extends NarrowConfirmationViewProps {
  txInfo: SettingsChangeType
}

const SettingsChange: React.FC<SettingsChangeProps> = ({ txInfo: { settingsInfo } }) => {
  const { safe } = useSafeInfo()
  const params = useContext(SettingsChangeContext)

  if (!settingsInfo || settingsInfo.type === SettingsInfoType.REMOVE_OWNER) return null

  const shouldShowChangeSigner = 'owner' in settingsInfo || 'newOwner' in params
  const hasNewOwner = 'newOwner' in params
  const newSignersLength = safe.owners.length + ('removedOwner' in settingsInfo ? 0 : 1)

  return (
    <SettingsChangeView
      oldOwner={'oldOwner' in settingsInfo ? settingsInfo.oldOwner : undefined}
      ownerList={'owner' in settingsInfo && !hasNewOwner && <OwnerList owners={[settingsInfo.owner]} />}
      newOwnerList={
        hasNewOwner && <OwnerList owners={[{ name: params.newOwner.name, value: params.newOwner.address }]} />
      }
      warning={shouldShowChangeSigner && <ChangeSignerSetupWarning />}
      hasThreshold={'threshold' in settingsInfo}
      threshold={'threshold' in settingsInfo ? settingsInfo.threshold : undefined}
      newSignersLength={newSignersLength}
    />
  )
}

export default SettingsChange
