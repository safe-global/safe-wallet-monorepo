import type { AddressInfo, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { MethodDetails } from '@/components/transactions/TxDetails/TxData/DecodedData/MethodDetails'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import MethodCall from './MethodCall'
import { useNativeTokenInfo } from '@/hooks/useNativeTokenInfo'
import { DelegateCallWarning, UntrustedFallbackHandlerWarning } from '@/components/transactions/Warning'
import { useSetsUntrustedFallbackHandler } from '@/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'
import { DecodedDataView } from '@views/components/transactions/TxDetails/TxData/DecodedData/DecodedDataView'

interface Props {
  txData: TransactionDetails['txData']
  toInfo?: AddressInfo
  isTxExecuted?: boolean
  isWarningEnabled?: boolean
}

const DecodedData = ({
  txData,
  toInfo,
  isTxExecuted = false,
  isWarningEnabled = false,
}: Props): ReactElement | null => {
  const nativeTokenInfo = useNativeTokenInfo()
  const setsUntrustedFallbackHandler = useSetsUntrustedFallbackHandler(txData)

  // nothing to render
  if (!txData) {
    if (!toInfo) return null

    return (
      <DecodedDataView
        hasTxData={false}
        renderSendToBlock={(props) => (
          <SendToBlock address={toInfo.value} name={toInfo.name} customAvatar={toInfo.logoUri} {...props} />
        )}
      />
    )
  }

  const amountInWei = txData.value ?? '0'
  const toAddress = toInfo?.value || txData.to?.value
  const method = txData.dataDecoded?.method || ''
  const addressInfo = txData.addressInfoIndex?.[toAddress]
  const name = addressInfo?.name || toInfo?.name || txData.to?.name
  const avatar = addressInfo?.logoUri || toInfo?.logoUri || txData.to?.logoUri
  const hexData = txData.hexData

  return (
    <DecodedDataView
      hasTxData
      untrustedFallbackHandlerWarning={
        setsUntrustedFallbackHandler && <UntrustedFallbackHandlerWarning isTxExecuted={isTxExecuted} />
      }
      delegateCallWarning={<DelegateCallWarning txData={txData} showWarning={isWarningEnabled} />}
      methodCall={
        method ? (
          <MethodCall contractAddress={toAddress} contractName={name} contractLogo={avatar} method={method} />
        ) : undefined
      }
      renderSendToBlock={(props) => <SendToBlock address={toAddress} name={name} customAvatar={avatar} {...props} />}
      showValue={amountInWei !== '0'}
      renderSendAmountBlock={(props) => (
        <SendAmountBlock amountInWei={amountInWei} tokenInfo={nativeTokenInfo} {...props} />
      )}
      methodDetails={
        txData.dataDecoded ? (
          <MethodDetails
            data={txData.dataDecoded}
            hexData={txData.hexData}
            addressInfoIndex={txData.addressInfoIndex}
          />
        ) : undefined
      }
      showHexData={!!hexData}
      renderHexData={(props) => hexData && <HexEncodedData hexData={hexData} {...props} />}
    />
  )
}

export default DecodedData
