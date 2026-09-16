import type { AddressInfo, DataDecoded } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isAddress, isArrayParameter, isByte } from '@/utils/transaction-guards'
import { Typography } from '@/components/ui/typography'
import { Value } from '@/components/transactions/TxDetails/TxData/DecodedData/ValueArray'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'

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
      <>
        <Typography variant="paragraph-small" className="text-muted-foreground">
          No parameters
        </Typography>
        {showHexData && <HexEncodedData title="Data" hexData={hexData} />}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {data.parameters?.map((param, index) => {
        const isArrayValueParam = isArrayParameter(param.type) || Array.isArray(param.value)
        const inlineType = isAddress(param.type) ? 'address' : isByte(param.type) ? 'bytes' : undefined
        const addressEx = typeof param.value === 'string' ? addressInfoIndex?.[param.value] : undefined

        const title = (
          <div className="-mb-1.5">
            <Typography variant="paragraph-small">{param.name}</Typography>{' '}
            <Typography variant="paragraph-small" className="text-muted-foreground">
              {param.type}
            </Typography>
          </div>
        )

        return (
          <TxDataRow key={`${data.method}_param-${index}`} title={title}>
            {isArrayValueParam ? (
              <Value method={data.method} type={param.type} value={param.value as string} />
            ) : (
              generateDataRowValue(param.value as string, inlineType, true, addressEx)
            )}
          </TxDataRow>
        )
      })}
    </div>
  )
}
