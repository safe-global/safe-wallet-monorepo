import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { isAddress, isArrayParameter } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import {
  ValueView,
  type ParsedValue,
} from '@views/components/transactions/TxDetails/TxData/DecodedData/ValueArray/ValueArrayView'

type ValueArrayProps = {
  method: string
  type: string
  value: string | string[]
  key?: string
}

// Sometime DApps return stringified arrays, e.g. "["hello","world"]"
const parseValue = (value: ValueArrayProps['value']): ParsedValue => {
  if (Array.isArray(value)) {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const renderAddress = (address: string) => (
  <EthHashInfo address={address} showAvatar={false} shortAddress={false} showCopyButton hasExplorer />
)

const renderHexData = (hexData: string, key?: string) => (
  <HexEncodedData highlightFirstBytes={false} limit={60} hexData={hexData} key={key} />
)

export const Value = ({ type, value, ...props }: ValueArrayProps): ReactElement => {
  const parsedValue = useMemo(() => {
    return parseValue(value)
  }, [value])

  return (
    <ValueView
      isAddressArray={isArrayParameter(type) && isAddress(type)}
      value={parsedValue}
      method={props.method}
      valueKey={props.key}
      renderAddress={renderAddress}
      renderHexData={renderHexData}
    />
  )
}
