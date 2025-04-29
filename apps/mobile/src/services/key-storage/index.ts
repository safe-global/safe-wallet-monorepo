import { KeyStorageService } from './key-storage.service'
import { WalletService } from './wallet.service'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import { IWalletService } from './wallet.service'

export { KeyStorageService, WalletService, type IKeyStorageService, type IWalletService, type PrivateKeyStorageOptions }

export const keyStorageService = new KeyStorageService()
export const walletService = new WalletService()
