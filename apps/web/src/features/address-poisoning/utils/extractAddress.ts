import { isAddress } from 'ethers'

/** Pull a bare `0x…` address out of a possibly chain-prefixed value (`sep:0x…`), or undefined. */
export const extractAddress = (value: unknown): string | undefined => {
  const raw = String(value ?? '')
    .split(':')
    .pop()
  return raw && isAddress(raw) ? raw : undefined
}
