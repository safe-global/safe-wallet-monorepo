import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { Value } from '@/components/transactions/TxDetails/TxData/DecodedData/ValueArray'
import { isByte } from '@/utils/transaction-guards'
import { type TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import { isAddress } from 'ethers'
import { useMemo, type ReactElement } from 'react'
import Msg from '@views/components/safe-messages/Msg'
import { normalizeMessageForDisplay } from '@/services/safe-messages/normalizeMessage'
import { DecodedMsgView, DecodedTypedObjectView } from '@views/components/safe-messages/DecodedMsg/DecodedMsgView'

const EIP712_DOMAIN_TYPE = 'EIP712Domain'

const DecodedTypedObject = ({ displayedType, eip712Msg }: { displayedType: string; eip712Msg: TypedData }) => {
  const { types, message: msg, domain } = eip712Msg
  const findType = (paramName: string) => types[displayedType].find((paramType) => paramType.name === paramName)?.type

  const rows = Object.entries(displayedType === EIP712_DOMAIN_TYPE ? domain : msg).map((param, index) => {
    const [paramName, paramValue] = param
    const type = findType(paramName) || 'string'

    const isArrayValueParam = Array.isArray(paramValue)
    const isNested = Object.keys(types).some((typeName) => typeName === type || `${typeName}[]` === type)
    const inlineType = isAddress(paramValue as string) ? 'address' : isByte(type) ? 'bytes' : undefined
    const paramValueAsString = typeof paramValue === 'string' ? paramValue : JSON.stringify(paramValue, null, 2)

    return {
      key: `${displayedType}_param-${index}`,
      title: `${param[0]}(${type})`,
      isNested,
      valueAsString: paramValueAsString,
      value: isNested ? null : isArrayValueParam ? (
        <Value method={displayedType} type={type} value={paramValueAsString} />
      ) : (
        generateDataRowValue(paramValueAsString, inlineType, true)
      ),
    }
  })

  return <DecodedTypedObjectView displayedType={displayedType} rows={rows} />
}

export const DecodedMsg = ({
  message,
  isInModal = false,
}: {
  message: MessageItem['message'] | undefined
  isInModal?: boolean
}): ReactElement | null => {
  const isTextMessage = typeof message === 'string'

  // Normalize the message so we know its primaryType
  const normalizedMsg = useMemo<TypedData | undefined>(
    () => (message && typeof message !== 'string' ? normalizeMessageForDisplay(message) : undefined),
    [message],
  )

  if (!message) {
    return null
  }
  if (isTextMessage) {
    return <Msg message={message} />
  }
  if (!normalizedMsg) {
    return null
  }

  return (
    <DecodedMsgView
      isInModal={isInModal}
      renderErrorBoundary={(props) => <ObservabilityErrorBoundary {...props} />}
      domainObject={<DecodedTypedObject eip712Msg={normalizedMsg} displayedType={EIP712_DOMAIN_TYPE} />}
      primaryObject={<DecodedTypedObject eip712Msg={normalizedMsg} displayedType={normalizedMsg.primaryType} />}
    />
  )
}
