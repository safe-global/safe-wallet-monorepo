import { getAddress, isAddress } from 'viem'

export type ResolveName = (name: string) => Promise<string | null>

const withoutPrefix = (input: string, networkPrefix: string): string | undefined => {
  const [prefix, rest] = input.split(':')
  if (rest === undefined) return input
  return prefix === networkPrefix ? rest : undefined
}

/** Returns the checksummed recipient address, or `undefined` when the input names no address. */
export async function resolveRecipient(
  input: string,
  networkPrefix: string,
  resolveName: ResolveName,
): Promise<string | undefined> {
  const value = withoutPrefix(input.trim(), networkPrefix)
  if (!value) return undefined

  if (!value.includes('.')) return isAddress(value) ? getAddress(value) : undefined

  const resolved = await resolveName(value).catch(() => null)
  return resolved ? getAddress(resolved) : undefined
}
