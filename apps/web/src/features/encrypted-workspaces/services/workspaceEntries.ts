import { getAddress } from 'ethers'
import { ENCRYPTED_ENTRY_MARKER, decryptBytes, encryptBytes } from './nameCipher'

// CGW's maximum length for a contact name, in code points.
const ENTRY_MAX_LENGTH = 50

// The real chains are inside the encrypted entry; CGW only needs a chain it knows.
export const ENTRY_CHAIN_IDS = ['1']

export type WorkspaceEntry = { kind: 'contact' | 'safe'; address: string; chainIds: string[]; name: string }

const KINDS: Array<WorkspaceEntry['kind']> = ['contact', 'safe']
const ADDRESS_BYTES = 20
const HEADER_BYTES = 2 + ADDRESS_BYTES

const hexToBytes = (hex: string): Uint8Array =>
  Uint8Array.from(hex.slice(2).match(/../g) ?? [], (byte) => parseInt(byte, 16))

const bytesToAddress = (bytes: Uint8Array): string =>
  getAddress(`0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`)

// Layout: kind, chain count, address, chain ids as uint32, name length, name.
export const encryptEntry = (entry: WorkspaceEntry, key: CryptoKey): Promise<string> => {
  const name = new TextEncoder().encode(entry.name)
  const chainsEnd = HEADER_BYTES + 4 * entry.chainIds.length
  const bytes = new Uint8Array(chainsEnd + 1 + name.length)
  const view = new DataView(bytes.buffer)

  bytes[0] = KINDS.indexOf(entry.kind)
  bytes[1] = entry.chainIds.length
  bytes.set(hexToBytes(entry.address), 2)
  entry.chainIds.forEach((chainId, index) => view.setUint32(HEADER_BYTES + 4 * index, Number(chainId)))
  bytes[chainsEnd] = name.length
  bytes.set(name, chainsEnd + 1)

  return encryptBytes(bytes, key, ENTRY_MAX_LENGTH, ENCRYPTED_ENTRY_MARKER)
}

export const decryptEntry = async (value: string, key: CryptoKey): Promise<WorkspaceEntry | undefined> => {
  const bytes = await decryptBytes(value, key)
  if (!bytes || bytes.length < HEADER_BYTES + 1) return undefined

  const view = new DataView(bytes.buffer, bytes.byteOffset)
  const chainCount = bytes[1]
  const chainsEnd = HEADER_BYTES + 4 * chainCount
  const nameLength = bytes[chainsEnd]

  return {
    kind: KINDS[bytes[0]],
    address: bytesToAddress(bytes.slice(2, HEADER_BYTES)),
    chainIds: Array.from({ length: chainCount }, (_, index) => String(view.getUint32(HEADER_BYTES + 4 * index))),
    name: new TextDecoder().decode(bytes.slice(chainsEnd + 1, chainsEnd + 1 + nameLength)),
  }
}

/** The address CGW stores for an entry: the same entry always gets the same address, so updates and deletes find it. */
export const entryAddress = async (
  kind: WorkspaceEntry['kind'],
  address: string,
  chainId: string | undefined,
  key: CryptoKey,
): Promise<string> => {
  const data = new TextEncoder().encode(`${kind}:${chainId ?? ''}:${address.toLowerCase()}`)
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  return bytesToAddress(digest.slice(0, ADDRESS_BYTES))
}
