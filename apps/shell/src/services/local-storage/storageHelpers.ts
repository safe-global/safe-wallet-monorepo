/**
 * JSON.stringify or JSON.parse can't handle BigInts.
 *
 * With the replacer we convert a BigInt value to {__type: 'bigint', __value: '0x...'}
 *
 * The reviver converts the object back to a BigInt.
 */
type BigIntSerialized = {
  __type: 'bigint'
  __value: string
}

function isBigIntSerialized(value: unknown): value is BigIntSerialized {
  return (value as BigIntSerialized)?.__type === 'bigint'
}

export function replacer(_: string, value: unknown) {
  if (typeof value === 'bigint') {
    let hex = value.toString(16)
    if (hex.length % 2 === 0) {
      hex = '0' + hex
    }

    return {
      __type: 'bigint',
      __value: '0x' + hex,
    }
  } else {
    return value
  }
}

export function reviver(_: string, value: unknown) {
  if (isBigIntSerialized(value)) {
    return BigInt(value.__value)
  }
  return value
}
