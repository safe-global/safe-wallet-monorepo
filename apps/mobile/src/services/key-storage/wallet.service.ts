import { Wallet, HDNodeWallet } from 'ethers'
import Logger from '@/src/utils/logger'

export interface IWalletService {
  createMnemonicAccount(mnemonic: string): Promise<HDNodeWallet | undefined>
}

export class WalletService implements IWalletService {
  async createMnemonicAccount(mnemonic: string): Promise<HDNodeWallet | undefined> {
    try {
      if (!mnemonic) {
        return
      }

      return Wallet.fromPhrase(mnemonic)
    } catch (err) {
      Logger.error('CreateMnemonicAccountFailed', err)
      return undefined
    }
  }
}
