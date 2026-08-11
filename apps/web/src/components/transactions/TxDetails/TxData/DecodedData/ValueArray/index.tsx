import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { isAddress, isArrayParameter } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import css from './styles.module.css'

type ValueArrayProps = {
  method: string
  type: string
  value: string | string[]
  key?: string
}

// Sometime DApps return stringified arrays, e.g. "["hello","world"]"
const parseValue = (value: ValueArrayProps['value']) => {
  if (Array.isArray(value)) {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const Value = ({ type, value, ...props }: ValueArrayProps): ReactElement => {
  const parsedValue = useMemo(() => {
    return parseValue(value)
  }, [value])

  if (isArrayParameter(type) && isAddress(type) && Array.isArray(parsedValue)) {
    return (
      <div className="text-sm">
        [
        {parsedValue.length > 0 && (
          <div className={css.nestedWrapper}>
            {parsedValue.map((address, index) => {
              const key = `${props.key || props.method}-${index}`
              if (Array.isArray(address)) {
                const newProps = {
                  type,
                  ...props,
                  value: address,
                }
                return <Value key={key} {...newProps} />
              }
              return (
                <div key={`${address}_${key}`}>
                  <EthHashInfo address={address} showAvatar={false} shortAddress={false} showCopyButton hasExplorer />
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

const getTextValue = (value: string, key?: string) => {
  return <HexEncodedData highlightFirstBytes={false} limit={60} hexData={value} key={key} />
}

const getArrayValue = (parentId: string, value: string[], separator?: boolean) => (
  <div className="text-sm">
    [
    <div className={css.nestedWrapper}>
      {value.map((currentValue, index, values) => {
        const key = `${parentId}-value-${index}`
        const hasSeparator = index < values.length - 1

        return Array.isArray(currentValue) ? (
          <div key={key}>{getArrayValue(key, currentValue, hasSeparator)}</div>
        ) : (
          getTextValue(currentValue, key)
        )
      })}
    </div>
    ]{separator ? ',' : null}
  </div>
)

const GenericValue = ({ method, value }: Omit<ValueArrayProps, 'type'>): React.ReactElement => {
  if (Array.isArray(value)) {
    return getArrayValue(method, value)
  }

  return getTextValue(value)
}
