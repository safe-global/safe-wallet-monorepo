import { SettingsInfoType } from '@safe-global/store/gateway/types'
import type { AddressInfo, SettingsChangeTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ComponentProps, ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { UntrustedFallbackHandlerWarning } from '@/components/transactions/Warning'
import { useHasUntrustedFallbackHandler } from '@/hooks/useHasUntrustedFallbackHandler'
import { SettingsChangeTxInfoView } from '@views/components/transactions/TxDetails/TxData/SettingsChange/SettingsChangeTxInfoView'

type SettingsChangeTxInfoProps = {
  settingsInfo: SettingsChangeTransaction['settingsInfo']
  isTxExecuted?: boolean
}

const addressInfoProps: Pick<ComponentProps<typeof EthHashInfo>, 'shortAddress' | 'showCopyButton' | 'hasExplorer'> = {
  shortAddress: false,
  showCopyButton: true,
  hasExplorer: true,
}

const renderAddress = (addressInfo: AddressInfo) => (
  <EthHashInfo
    address={addressInfo.value}
    name={addressInfo?.name}
    customAvatar={addressInfo?.logoUri}
    {...addressInfoProps}
  />
)

const SettingsChangeTxInfo = ({
  settingsInfo,
  isTxExecuted = false,
}: SettingsChangeTxInfoProps): ReactElement | null => {
  const isUntrustedFallbackHandler = useHasUntrustedFallbackHandler(
    settingsInfo?.type === SettingsInfoType.SET_FALLBACK_HANDLER ? settingsInfo.handler.value : undefined,
  )

  if (!settingsInfo) {
    return null
  }

  return (
    <SettingsChangeTxInfoView
      settingsInfo={settingsInfo}
      renderAddress={renderAddress}
      untrustedFallbackHandlerWarning={
        isUntrustedFallbackHandler && <UntrustedFallbackHandlerWarning isTxExecuted={isTxExecuted} />
      }
    />
  )
}

export default SettingsChangeTxInfo
