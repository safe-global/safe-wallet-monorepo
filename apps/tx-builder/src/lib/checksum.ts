import { keccak256, toUtf8Bytes } from 'ethers'
import { BatchFile } from '../typings/models'

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

// JSON spec does not allow undefined so stringify removes the prop
// That's a problem for calculating the checksum back so this function avoid the issue
export const stringifyReplacer = (_: string, value: unknown) => (value === undefined ? null : value)

const serializeJSONObject = (json: JSONValue): string => {
  if (Array.isArray(json)) {
    return `[${json.map((el) => serializeJSONObject(el)).join(',')}]`
  }

  if (typeof json === 'object' && json !== null) {
    let acc = ''
    const keys = Object.keys(json).sort()
    acc += `{${JSON.stringify(keys, stringifyReplacer)}`

    for (let i = 0; i < keys.length; i++) {
      acc += `${serializeJSONObject(json[keys[i]])},`
    }

    return `${acc}}`
  }

  return `${JSON.stringify(json, stringifyReplacer)}`
}

const calculateChecksumWithoutMeta = (batchFile: BatchFile): string | undefined => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { checksum, ...metaWithoutChecksum } = batchFile.meta
  const serialized = serializeJSONObject({
    ...batchFile,
    meta: { ...metaWithoutChecksum, name: null },
  } as unknown as JSONValue)
  const sha = keccak256(toUtf8Bytes(serialized))

  return sha || undefined
}

export const addChecksum = (batchFile: BatchFile): BatchFile => {
  return {
    ...batchFile,
    meta: {
      ...batchFile.meta,
      checksum: calculateChecksumWithoutMeta(batchFile),
    },
  }
}

export const validateChecksum = (batchFile: BatchFile): boolean => {
  const checksum = batchFile.meta.checksum
  return calculateChecksumWithoutMeta(batchFile) === checksum
}
