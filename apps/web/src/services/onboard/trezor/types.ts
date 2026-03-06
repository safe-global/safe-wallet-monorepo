import type { EthereumTransaction, EthereumTransactionEIP1559 } from '@trezor/connect-web'

export type StoredAccount = { address: string; derivationPath: string; chainId: string }

export type ResolvedAddress = { address: `0x${string}`; path: string }

// Alias the SDK union so callers don't need to import from @trezor/connect-web directly
export type TrezorTransaction = EthereumTransaction | EthereumTransactionEIP1559
