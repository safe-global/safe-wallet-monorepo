import { KeyStorageService } from './key-storage.service'
import { WalletService } from './wallet.service'
import { IKeyStorageService, PrivateKeyStorageOptions } from './types'
import { IWalletService } from './wallet.service'

export { KeyStorageService, WalletService }
export type { IKeyStorageService, IWalletService, PrivateKeyStorageOptions }
export { BIOMETRY_ROTATION_DESCRIPTION, BiometryInvalidationError, isBiometryInvalidationError } from './errors'

export const keyStorageService = new KeyStorageService()
export const walletService = new WalletService()
