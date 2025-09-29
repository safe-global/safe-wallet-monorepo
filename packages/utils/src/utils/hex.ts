export const isEmptyHexData = (encodedData: string): boolean => encodedData !== '' && isNaN(parseInt(encodedData, 16))

export const numberToHex = (value: number | bigint): `0x${string}` => `0x${value.toString(16)}`
