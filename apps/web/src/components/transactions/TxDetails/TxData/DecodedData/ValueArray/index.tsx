import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { isAddress, isArrayParameter } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { formatDecodedValue, isList, parseDecodedValue } from '../decodedValue'
import css from './styles.module.css'

type ValueArrayProps = {
  method: string
  type: string
  value: unknown
  key?: string
}

export const Value = ({ type, value, ...props }: ValueArrayProps): ReactElement => {
  const parsedValue = useMemo(() => {
    return parseDecodedValue(value)
  }, [value])

  if (isArrayParameter(type) && isAddress(type) && isList(parsedValue)) {
    return (
      <div className="text-sm">
        [
        {parsedValue.length > 0 && (
          <div className={css.nestedWrapper}>
            {parsedValue.map((address, index) => {
              const key = `${props.key || props.method}-${index}`
              if (isList(address)) {
                const newProps = {
                  type,
                  ...props,
                  value: address,
                }
                return <Value key={key} {...newProps} />
              }
              return (
                <div key={`${address}_${key}`}>
                  <EthHashInfo
                    address={formatDecodedValue(address)}
                    showAvatar={false}
                    shortAddress={false}
                    showCopyButton
                    hasExplorer
                  />
                </div>
              )
            })}
          </div>
        )}
        ]
      </div>
    )
  }

  return <GenericValue value={parsedValue} {...props} />
}

const getTextValue = (value: unknown, key?: string) => {
  return <HexEncodedData highlightFirstBytes={false} limit={60} hexData={formatDecodedValue(value)} key={key} />
}

const getArrayValue = (parentId: string, value: unknown[], separator?: boolean) => (
  <div className="text-sm">
    [
    <div className={css.nestedWrapper}>
      {value.map((currentValue, index, values) => {
        const key = `${parentId}-value-${index}`
        const hasSeparator = index < values.length - 1

        return isList(currentValue) ? (
          <div key={key}>{getArrayValue(key, currentValue, hasSeparator)}</div>
        ) : (
          getTextValue(currentValue, key)
        )
      })}
    </div>
    ]{separator ? ',' : null}
  </div>
)

const GenericValue = ({ method, value }: { method: string; value: unknown }): React.ReactElement => {
  if (isList(value)) {
    return getArrayValue(method, value)
  }

  return getTextValue(value)
}
