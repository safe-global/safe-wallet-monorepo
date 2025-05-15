import type { ReactElement } from 'react'
import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { isAddress, isArrayParameter, isByte } from '@/utils/transaction-guards'
import type { AddressEx, DataDecoded } from '@safe-global/safe-gateway-typescript-sdk'
import { Box, Stack, Typography } from '@mui/material'
import { Value } from '@/components/transactions/TxDetails/TxData/DecodedData/ValueArray'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'

type MethodDetailsProps = {
  data: DataDecoded
  hexData?: string
  addressInfoIndex?: {
    [key: string]: AddressEx
  }
}

export const MethodDetails = ({ data, addressInfoIndex, hexData }: MethodDetailsProps): ReactElement | null => {
  const showHexData = data.method === 'fallback' && !data.parameters?.length && hexData
  if (!data.parameters?.length) {
    return (
      <>
        <Typography color="text.secondary" variant="body2">
          No parameters
        </Typography>
        {showHexData && <HexEncodedData title="Data" hexData={hexData} />}
      </>
    )
  }

  return (
    <Stack gap={0.75}>
      {data.parameters?.map((param, index) => {
        const isArrayValueParam = isArrayParameter(param.type) || Array.isArray(param.value)
        const inlineType = isAddress(param.type) ? 'address' : isByte(param.type) ? 'bytes' : undefined
        const addressEx = typeof param.value === 'string' ? addressInfoIndex?.[param.value] : undefined

        const title = (
          <Box mb={-0.75}>
            <Typography variant="body2" component="span">
              {param.name}
            </Typography>{' '}
            <Typography variant="body2" component="span" color="text.secondary">
              {param.type}
            </Typography>
          </Box>
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
    </Stack>
  )
}
