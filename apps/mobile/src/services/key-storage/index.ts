import { KeyStorageService } from './key-storage.service'
import { WalletService } from './wallet.service'
import { IKeyStorageService, PrivateKeyStorageOptions, PrivateKeyReadOptions } from './types'
import { IWalletService } from './wallet.service'

export { KeyStorageService, WalletService }
export type { IKeyStorageService, IWalletService, PrivateKeyStorageOptions, PrivateKeyReadOptions }
export {
  BIOMETRY_ROTATION_DESCRIPTION,
  BiometryInvalidationError,
  MissingWrappingKeyError,
  MissingStoredKeyError,
  KeyStorageError,
  isBiometryInvalidationError,
} from './errors'

export const keyStorageService = new KeyStorageService()
export const walletService = new WalletService()
