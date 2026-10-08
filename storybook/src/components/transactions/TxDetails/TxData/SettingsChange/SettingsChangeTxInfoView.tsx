import type { AddressInfo, SettingsChangeTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement, ReactNode } from 'react'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { ThresholdWarningView as ThresholdWarning } from '@/components/transactions/Warning/WarningView'

export type SettingsChangeTxInfoViewProps = {
  settingsInfo: NonNullable<SettingsChangeTransaction['settingsInfo']>
  renderAddress: (addressInfo: AddressInfo) => ReactNode
  untrustedFallbackHandlerWarning?: ReactNode
}

export const SettingsChangeTxInfoView = ({
  settingsInfo,
  renderAddress,
  untrustedFallbackHandlerWarning,
}: SettingsChangeTxInfoViewProps): ReactElement => {
  switch (settingsInfo.type) {
    case 'SET_FALLBACK_HANDLER': {
      return (
        <>
          <InfoDetails title="Set fallback handler:">{renderAddress(settingsInfo.handler)}</InfoDetails>
          {untrustedFallbackHandlerWarning}
        </>
      )
    }
    case 'ADD_OWNER':
    case 'REMOVE_OWNER': {
      const title = settingsInfo.type === 'ADD_OWNER' ? 'Add signer:' : 'Remove signer:'
      return (
        <>
          <ThresholdWarning />
          <InfoDetails datatestid="owner-action" title={title}>
            {renderAddress(settingsInfo.owner)}
            <InfoDetails datatestid="required-confirmations" title="Required confirmations for new transactions:">
              {settingsInfo.threshold}
            </InfoDetails>
          </InfoDetails>
        </>
      )
    }
    case 'SWAP_OWNER': {
      return (
        <InfoDetails datatestid="swap-owner" title="Swap signer:">
          <InfoDetails datatestid="old-owner" title="Old signer">
            {renderAddress(settingsInfo.oldOwner)}
          </InfoDetails>
          <InfoDetails datatestid="new-owner" title="New signer">
            {renderAddress(settingsInfo.newOwner)}
          </InfoDetails>
        </InfoDetails>
      )
    }
    case 'CHANGE_THRESHOLD': {
      return (
        <>
          <ThresholdWarning />
          <InfoDetails datatestid="required-confirmations" title="Required confirmations for new transactions:">
            {settingsInfo.threshold}
          </InfoDetails>
        </>
      )
    }
    case 'CHANGE_MASTER_COPY': {
      return <InfoDetails title="Change implementation:">{renderAddress(settingsInfo.implementation)}</InfoDetails>
    }
    case 'ENABLE_MODULE':
    case 'DISABLE_MODULE': {
      const title = settingsInfo.type === 'ENABLE_MODULE' ? 'Enable module:' : 'Disable module:'
      return (
        <InfoDetails datatestid="module-action" title={title}>
          {renderAddress(settingsInfo.module)}
        </InfoDetails>
      )
    }
    case 'SET_GUARD': {
      return <InfoDetails title="Set guard:">{renderAddress(settingsInfo.guard)}</InfoDetails>
    }
    case 'DELETE_GUARD': {
      return <InfoDetails title="Delete guard" />
    }
    default:
      return <></>
  }
}
