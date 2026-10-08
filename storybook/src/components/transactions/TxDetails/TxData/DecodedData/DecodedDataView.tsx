import type { ReactElement, ReactNode } from 'react'

export type DecodedDataViewProps = {
  hasTxData: boolean
  renderSendToBlock: (props: { title: string; avatarSize: number }) => ReactNode
  untrustedFallbackHandlerWarning?: ReactNode
  delegateCallWarning?: ReactNode
  methodCall?: ReactNode
  showValue?: boolean
  renderSendAmountBlock?: (props: { title: string }) => ReactNode
  methodDetails?: ReactNode
  showHexData?: boolean
  renderHexData?: (props: { title: string }) => ReactNode
}

export const DecodedDataView = ({
  hasTxData,
  renderSendToBlock,
  untrustedFallbackHandlerWarning,
  delegateCallWarning,
  methodCall,
  showValue,
  renderSendAmountBlock,
  methodDetails,
  showHexData,
  renderHexData,
}: DecodedDataViewProps): ReactElement => {
  if (!hasTxData) {
    return <>{renderSendToBlock({ title: 'Interact with', avatarSize: 26 })}</>
  }

  return (
    <div className="flex flex-col gap-4">
      {untrustedFallbackHandlerWarning}
      {delegateCallWarning}

      {methodCall ? methodCall : renderSendToBlock({ title: 'Interacted with', avatarSize: 20 })}

      {showValue && renderSendAmountBlock?.({ title: 'Value' })}

      {methodDetails ? (
        methodDetails
      ) : showHexData ? (
        <div data-testid="hexData" className="text-sm">
          {renderHexData?.({ title: 'Data' })}
        </div>
      ) : null}
    </div>
  )
}
