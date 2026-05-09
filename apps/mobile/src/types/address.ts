import { Signer } from '@/src/store/signersSlice'

export interface SafeInfo {
  address: Address
  chainId: string
}

export type SignerInfo = Signer

export type Address = `0x${string}`
