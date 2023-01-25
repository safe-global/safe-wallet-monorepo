import { generateDataRowValue, TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import { Value } from '@/components/transactions/TxDetails/TxData/DecodedData/ValueArray'
import { isByte } from '@/utils/transaction-guards'
import { type EIP712Normalized, normalizeTypedData } from '@/utils/web3'
import { Box, Typography } from '@mui/material'
import type { SafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import classNames from 'classnames'
import { isAddress } from 'ethers/lib/utils'
import { isObject } from 'lodash'
import type { ReactElement } from 'react'
import Msg from '../Msg'
import css from './styles.module.css'

const EIP712_DOMAIN_TYPE = 'EIP712Domain'

const DecodedTypedObject = ({ displayedType, eip712Msg }: { displayedType: string; eip712Msg: EIP712Normalized }) => {
  const { types, message: msg, domain } = eip712Msg
  const findType = (paramName: string) => types[displayedType].find((paramType) => paramType.name === paramName)?.type
  return (
    <Box>
      <Typography
        textTransform="uppercase"
        fontWeight={700}
        variant="caption"
        sx={({ palette }) => ({ color: `${palette.border.main}` })}
      >
        {displayedType}
      </Typography>

      {Object.entries(displayedType === EIP712_DOMAIN_TYPE ? domain : msg).map((param, index) => {
        const [paramName, paramValue] = param
        const type = findType(paramName) || 'string'

        const isArrayValueParam = Array.isArray(paramValue)
        const isNested = isObject(paramValue)
        const inlineType = isAddress(paramValue as string) ? 'address' : isByte(type) ? 'bytes' : undefined
        const paramValueAsString = typeof paramValue === 'string' ? paramValue : JSON.stringify(paramValue, null, 2)
        return (
          <TxDataRow key={`${displayedType}_param-${index}`} title={`${param[0]}(${type}):`}>
            {isArrayValueParam ? (
              <Value method={displayedType} type={type} value={paramValueAsString} />
            ) : isNested ? (
              <Box
                className={css.nestedMsg}
                sx={{
                  borderRadius: (theme) => `${theme.shape.borderRadius}px`,
                }}
              >
                {paramValueAsString}
              </Box>
            ) : (
              generateDataRowValue(paramValueAsString, inlineType, true)
            )}
          </TxDataRow>
        )
      })}
    </Box>
  )
}

export const DecodedMsg = ({
  message,
  isInModal = false,
}: {
  message: SafeMessage['message'] | undefined
  isInModal?: boolean
}): ReactElement | null => {
  const isTextMessage = typeof message === 'string'

  if (!message) {
    return null
  }
  if (isTextMessage) {
    return <Msg message={message} />
  }

  // Normalize message such that we know the primaryType
  const normalizedMsg = normalizeTypedData(message)

  return (
    <Box
      className={classNames(css.container, { [css.scrollable]: isInModal })}
      sx={{
        borderRadius: (theme) => `${theme.shape.borderRadius}px`,
      }}
    >
      <DecodedTypedObject eip712Msg={normalizedMsg} displayedType={EIP712_DOMAIN_TYPE} />
      <DecodedTypedObject eip712Msg={normalizedMsg} displayedType={normalizedMsg.primaryType} />
    </Box>
  )
}
