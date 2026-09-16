import type { EthersError } from '@/utils/ethers-utils'
import { getWalletConnectLabel, type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { WALLET_KEYS } from '@/hooks/wallets/consts'
// Inlined to avoid importing from protocol-kit which has heavy dependencies
const EMPTY_DATA = '0x'
import { PRIVATE_KEY_MODULE_LABEL } from '@/services/private-key-module/constants'
import { type Eip1193Provider, type JsonRpcProvider } from 'ethers'
import { getStoreInstance } from '@/store'
import { rpcApi } from '@/store/api/rpc'

const WALLETCONNECT = 'WalletConnect'
const WC_LEDGER = 'Ledger Wallet'
export const EIP_7702_DELEGATED_ACCOUNT_PREFIX = '0xef0100'

const isWCRejection = (err: Error): boolean => {
  return /rejected/.test(err?.message)
}

const isEthersRejection = (err: EthersError): boolean => {
  return err.code === 'ACTION_REJECTED'
}

export const isWalletRejection = (err: EthersError | Error): boolean => {
  return isEthersRejection(err as EthersError) || isWCRejection(err)
}

export const isEthSignWallet = (wallet: ConnectedWallet): boolean => {
  return [WALLET_KEYS.TREZOR, WALLET_KEYS.KEYSTONE].includes(wallet.label.toUpperCase() as WALLET_KEYS)
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

const getAccountCode = (chainId: string, address: string): Promise<string> =>
  getStoreInstance().dispatch(rpcApi.endpoints.getCode.initiate({ chainId, address })).unwrap()

export const isSmartContract = async (chainId: string, address: string): Promise<boolean> => {
  const code = await getAccountCode(chainId, address)
  return code !== EMPTY_DATA
}

/** For callers holding a provider for a chain other than the active one, so the read is not cached. */
export const isSmartContractOnProvider = async (provider: JsonRpcProvider, address: string): Promise<boolean> => {
  return (await provider.getCode(address)) !== EMPTY_DATA
}

export const isEIP7702DelegatedAccount = async (chainId: string, address: string): Promise<boolean> => {
  const code = await getAccountCode(chainId, address)
  return code.startsWith(EIP_7702_DELEGATED_ACCOUNT_PREFIX)
}

export const isSmartContractWallet = async (chainId: string, address: string): Promise<boolean> => {
  const isContract = await isSmartContract(chainId, address)
  const isEIP7702 = await isEIP7702DelegatedAccount(chainId, address)
  return isContract && !isEIP7702
}

type Eip6963AnnounceProviderEvent = CustomEvent<{
  info: { name: string }
  provider: Eip1193Provider
}>

// With several wallet extensions installed, window.ethereum is owned by an arbitrary one,
// so the saved wallet must be looked up by its EIP-6963 announced name
const getInjectedProviderByLabel = (label: string): Eip1193Provider | undefined => {
  const announced: Eip6963AnnounceProviderEvent['detail'][] = []

  const onAnnounce = (event: Event) => {
    announced.push((event as Eip6963AnnounceProviderEvent).detail)
  }

  // Announcements are dispatched synchronously in response to the request event
  window.addEventListener('eip6963:announceProvider', onAnnounce)
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  window.removeEventListener('eip6963:announceProvider', onAnnounce)

  // No fallback to window.ethereum: it may be a different wallet than the saved one
  return announced.find(({ info }) => info.name === label)?.provider
}

/* Check if the last-used wallet can be reconnected without prompting the user. */
export const isWalletUnlocked = async (walletName: string): Promise<boolean> => {
  if ([PRIVATE_KEY_MODULE_LABEL, WALLETCONNECT].includes(walletName)) return true

  if (typeof window === 'undefined') return false

  const provider = getInjectedProviderByLabel(walletName)
  if (!provider) return false

  try {
    // eth_accounts never prompts; empty means locked or not authorized for this site
    const accounts = await provider.request({ method: 'eth_accounts' })
    return Array.isArray(accounts) && accounts.length > 0
  } catch {
    return false
  }
}
