import type { ComponentProps, ReactElement } from 'react'
import type { SettingsChange } from '@safe-global/safe-gateway-typescript-sdk'
import { SettingsInfoType } from '@safe-global/safe-gateway-typescript-sdk'
import EthHashInfo from '@/components/common/EthHashInfo'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import { ThresholdWarning } from '@/components/transactions/Warning'
import { UntrustedFallbackHandlerWarning } from '@/components/transactions/Warning'

type SettingsChangeTxInfoProps = {
  settingsInfo: SettingsChange['settingsInfo']
  isTxExecuted?: boolean
}

const addressInfoProps: Pick<ComponentProps<typeof EthHashInfo>, 'shortAddress' | 'showCopyButton' | 'hasExplorer'> = {
  shortAddress: false,
  showCopyButton: true,
  hasExplorer: true,
}

export const SettingsChangeTxInfo = ({
  settingsInfo,
  isTxExecuted = false,
}: SettingsChangeTxInfoProps): ReactElement | null => {
  if (!settingsInfo) {
    return null
  }

  switch (settingsInfo.type) {
    case SettingsInfoType.SET_FALLBACK_HANDLER: {
      return (
        <>
          <InfoDetails title="Set fallback handler:">
            <EthHashInfo
              address={settingsInfo.handler.value}
              name={settingsInfo.handler?.name}
              customAvatar={settingsInfo.handler?.logoUri}
              {...addressInfoProps}
            />
          </InfoDetails>
          <UntrustedFallbackHandlerWarning fallbackHandler={settingsInfo.handler.value} isTxExecuted={isTxExecuted} />
        </>
      )
    }
    case SettingsInfoType.ADD_OWNER:
    case SettingsInfoType.REMOVE_OWNER: {
      const title = settingsInfo.type === SettingsInfoType.ADD_OWNER ? 'Add signer:' : 'Remove signer:'
      return (
        <>
          <ThresholdWarning />
          <InfoDetails datatestid="owner-action" title={title}>
            <EthHashInfo
              address={settingsInfo.owner.value}
              name={settingsInfo.owner?.name}
              customAvatar={settingsInfo.owner?.logoUri}
              {...addressInfoProps}
            />
            <InfoDetails datatestid="required-confirmations" title="Required confirmations for new transactions:">
              {settingsInfo.threshold}
            </InfoDetails>
          </InfoDetails>
        </>
      )
    }
    case SettingsInfoType.SWAP_OWNER: {
      return (
        <InfoDetails datatestid="swap-owner" title="Swap signer:">
          <InfoDetails datatestid="old-owner" title="Old signer">
            <EthHashInfo
              address={settingsInfo.oldOwner.value}
              name={settingsInfo.oldOwner?.name}
              customAvatar={settingsInfo.oldOwner?.logoUri}
              {...addressInfoProps}
            />
          </InfoDetails>
          <InfoDetails datatestid="new-owner" title="New signer">
            <EthHashInfo
              address={settingsInfo.newOwner.value}
              name={settingsInfo.newOwner?.name}
              customAvatar={settingsInfo.newOwner?.logoUri}
              {...addressInfoProps}
            />
          </InfoDetails>
        </InfoDetails>
      )
    }
    case SettingsInfoType.CHANGE_THRESHOLD: {
      return (
        <>
          <ThresholdWarning />
          <InfoDetails datatestid="required-confirmations" title="Required confirmations for new transactions:">
            {settingsInfo.threshold}
          </InfoDetails>
        </>
      )
    }
    case SettingsInfoType.CHANGE_IMPLEMENTATION: {
      return (
        <InfoDetails title="Change implementation:">
          <EthHashInfo
            address={settingsInfo.implementation.value}
            name={settingsInfo.implementation?.name}
            customAvatar={settingsInfo.implementation?.logoUri}
            {...addressInfoProps}
          />
        </InfoDetails>
      )
    }
    case SettingsInfoType.ENABLE_MODULE:
    case SettingsInfoType.DISABLE_MODULE: {
      const title = settingsInfo.type === SettingsInfoType.ENABLE_MODULE ? 'Enable module:' : 'Disable module:'
      return (
        <InfoDetails datatestid="module-action" title={title}>
          <EthHashInfo
            address={settingsInfo.module.value}
            name={settingsInfo.module?.name}
            customAvatar={settingsInfo.module?.logoUri}
            {...addressInfoProps}
          />
        </InfoDetails>
      )
    }
    case SettingsInfoType.SET_GUARD: {
      return (
        <InfoDetails title="Set guard:">
          <EthHashInfo
            address={settingsInfo.guard.value}
            name={settingsInfo.guard?.name}
            customAvatar={settingsInfo.guard?.logoUri}
            {...addressInfoProps}
          />
        </InfoDetails>
      )
    }
    case SettingsInfoType.DELETE_GUARD: {
      return <InfoDetails title="Delete guard" />
    }
    default:
      return <></>
  }
}

export default SettingsChangeTxInfo
