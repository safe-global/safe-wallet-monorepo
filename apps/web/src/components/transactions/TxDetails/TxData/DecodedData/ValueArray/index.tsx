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

export const formatDecodedValue = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

const hasUnsafeInteger = (value: unknown): boolean =>
  Array.isArray(value) ? value.some(hasUnsafeInteger) : typeof value === 'number' && !Number.isSafeInteger(value)

// Sometime DApps return stringified arrays, e.g. "["hello","world"]"
const parseValue = (value: ValueArrayProps['value']): unknown => {
  if (Array.isArray(value)) {
    return value
  }

  try {
    const parsed: unknown = JSON.parse(value)
    // JSON.parse drops digits beyond 2^53, so such arrays stay as the raw string
    return Array.isArray(parsed) && !hasUnsafeInteger(parsed) ? parsed : value
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

const GenericValue = ({ method, value }: { method: string; value: unknown }): React.ReactElement => {
  if (Array.isArray(value)) {
    return getArrayValue(method, value)
  }

  return getTextValue(value)
}
