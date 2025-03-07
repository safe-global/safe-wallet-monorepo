import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export interface SafeInfo {
  address: Address
  chainId: string
}

export type SignerInfo = AddressInfo

export type Address = `0x${string}`
