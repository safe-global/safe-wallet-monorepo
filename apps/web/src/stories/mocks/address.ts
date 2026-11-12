import { dataSlice, getAddress, keccak256, toBeHex } from 'ethers'

/**
 * A fixed address for story data: the last 20 bytes of `keccak256(n)`, so it looks like a real address and
 * different numbers give different addresses. Stories need the same data in every render, so they never take
 * addresses from faker or the test builders.
 */
export const mockAddress = (n: number): string => getAddress(dataSlice(keccak256(toBeHex(n, 32)), 12))
