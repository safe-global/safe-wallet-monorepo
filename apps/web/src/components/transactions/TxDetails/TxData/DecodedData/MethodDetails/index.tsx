import type { AddressInfo, DataDecoded } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { generateDataRowValue } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isAddress, isArrayParameter, isByte } from '@/utils/transaction-guards'
import { Value } from '@/components/transactions/TxDetails/TxData/DecodedData/ValueArray'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { MethodDetailsView } from '@views/components/transactions/TxDetails/TxData/DecodedData/MethodDetails/MethodDetailsView'

type MethodDetailsProps = {
  data: DataDecoded
  hexData?: string | null
  addressInfoIndex?: {
    [key: string]: AddressInfo
  } | null
}

export const MethodDetails = ({ data, addressInfoIndex, hexData }: MethodDetailsProps): ReactElement | null => {
  const showHexData = data.method === 'fallback' && !data.parameters?.length && hexData
  if (!data.parameters?.length) {
    return (
      <MethodDetailsView
        showHexData={!!showHexData}
        renderHexData={({ title }) => hexData && <HexEncodedData title={title} hexData={hexData} />}
      />
    )
  }

  return (
    <MethodDetailsView
      params={data.parameters?.map((param, index) => {
        const isArrayValueParam = isArrayParameter(param.type) || Array.isArray(param.value)
        const inlineType = isAddress(param.type) ? 'address' : isByte(param.type) ? 'bytes' : undefined
        const addressEx = typeof param.value === 'string' ? addressInfoIndex?.[param.value] : undefined

        return {
          key: `${data.method}_param-${index}`,
          name: param.name,
          type: param.type,
          value: isArrayValueParam ? (
            <Value method={data.method} type={param.type} value={param.value as string} />
          ) : (
            generateDataRowValue(param.value as string, inlineType, true, addressEx)
          ),
        }
      })}
    />
  )
}
