import type { EthersError } from '@/utils/ethers-utils'
import { getWalletConnectLabel, type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { WALLET_KEYS } from '@/hooks/wallets/consts'
import { EMPTY_DATA } from '@safe-global/protocol-kit/dist/src/utils/constants'
import memoize from 'lodash/memoize'
import { PRIVATE_KEY_MODULE_LABEL } from '@/services/private-key-module'
import { type JsonRpcProvider } from 'ethers'

const WALLETCONNECT = 'WalletConnect'
const WC_LEDGER = 'Ledger Wallet'

const isWCRejection = (err: Error): boolean => {
  return /rejected/.test(err?.message)
}

const isEthersRejection = (err: EthersError): boolean => {
  return err.code === 'ACTION_REJECTED'
}

export const isWalletRejection = (err: EthersError | Error): boolean => {
  return isEthersRejection(err as EthersError) || isWCRejection(err)
}

export const isLedgerLive = (wallet: ConnectedWallet): boolean => {
  return getWalletConnectLabel(wallet) === WC_LEDGER
}

export const isLedger = (wallet: ConnectedWallet): boolean => {
  return wallet.label.toUpperCase() === WALLET_KEYS.LEDGER || isLedgerLive(wallet)
}

export const isWalletConnect = (wallet: ConnectedWallet): boolean => {
  return wallet.label.toLowerCase().startsWith(WALLETCONNECT.toLowerCase())
}

export const isHardwareWallet = (wallet: ConnectedWallet): boolean => {
  return [WALLET_KEYS.LEDGER, WALLET_KEYS.TREZOR, WALLET_KEYS.KEYSTONE].includes(
    wallet.label.toUpperCase() as WALLET_KEYS,
  )
}

export const isPKWallet = (wallet: ConnectedWallet): boolean => {
  return wallet.label.toUpperCase() === WALLET_KEYS.PK
}

export const isSmartContract = async (address: string, provider?: JsonRpcProvider): Promise<boolean> => {
  const web3 = provider ?? getWeb3ReadOnly()

  if (!web3) {
    throw new Error('Provider not found')
  }

  const code = await web3.getCode(address)

  return code !== EMPTY_DATA
}

export const isSmartContractWallet = memoize(
  async (_chainId: string, address: string): Promise<boolean> => {
    return isSmartContract(address)
  },
  (chainId, address) => chainId + address,
)

/* Check if the wallet is unlocked. */
export const isWalletUnlocked = async (walletName: string): Promise<boolean | undefined> => {
  if ([PRIVATE_KEY_MODULE_LABEL, WALLETCONNECT].includes(walletName)) return true

  const METAMASK_LIKE = ['MetaMask', 'Rabby Wallet', 'Zerion']

  // Only MetaMask exposes a method to check if the wallet is unlocked
  if (METAMASK_LIKE.includes(walletName)) {
    if (typeof window === 'undefined' || !window.ethereum?._metamask) return false
    try {
      return await window.ethereum?._metamask.isUnlocked()
    } catch {
      return false
    }
  }

  return false
}
