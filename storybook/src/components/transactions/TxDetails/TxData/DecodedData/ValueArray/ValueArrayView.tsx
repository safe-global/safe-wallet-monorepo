import type { ReactElement, ReactNode } from 'react'
import css from './styles.module.css'

export type ParsedValue = string | ParsedValue[]

type RenderHexData = (hexData: string, key?: string) => ReactElement

export type ValueViewProps = {
  isAddressArray: boolean
  value: ParsedValue
  method: string
  valueKey?: string
  renderAddress: (address: string) => ReactNode
  renderHexData: RenderHexData
}

export const ValueView = (props: ValueViewProps): ReactElement => {
  const { isAddressArray, value, method, valueKey, renderAddress, renderHexData } = props

  if (isAddressArray && Array.isArray(value)) {
    return (
      <div className="text-sm">
        [
        {value.length > 0 && (
          <div className={css.nestedWrapper}>
            {value.map((address, index) => {
              const key = `${valueKey || method}-${index}`
              if (Array.isArray(address)) {
                return <ValueView key={key} {...props} value={address} />
              }
              return <div key={`${address}_${key}`}>{renderAddress(address)}</div>
            })}
          </div>
        )}
        ]
      </div>
    )
  }

  return <GenericValue value={value} method={method} renderHexData={renderHexData} />
}

const getArrayValue = (
  parentId: string,
  value: ParsedValue[],
  renderHexData: RenderHexData,
  separator?: boolean,
): ReactElement => (
  <div className="text-sm">
    [
    <div className={css.nestedWrapper}>
      {value.map((currentValue, index, values) => {
        const key = `${parentId}-value-${index}`
        const hasSeparator = index < values.length - 1

        return Array.isArray(currentValue) ? (
          <div key={key}>{getArrayValue(key, currentValue, renderHexData, hasSeparator)}</div>
        ) : (
          renderHexData(currentValue, key)
        )
      })}
    </div>
    ]{separator ? ',' : null}
  </div>
)

const GenericValue = ({
  method,
  value,
  renderHexData,
}: {
  method: string
  value: ParsedValue
  renderHexData: RenderHexData
}): ReactElement => {
  if (Array.isArray(value)) {
    return getArrayValue(method, value, renderHexData)
  }

  return renderHexData(value)
}
