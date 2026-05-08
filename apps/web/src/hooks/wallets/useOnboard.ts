import { useEffect } from 'react'
import { type WalletState, type OnboardAPI } from '@web3-onboard/core'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { Eip1193Provider } from 'ethers'
import { getAddress } from 'ethers'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { logError, Errors } from '@/services/exceptions'
import { trackEvent, WALLET_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { localItem } from '@/services/local-storage/local'
import { isWalletConnect, isWalletUnlocked } from '@/utils/wallets'
import { setUnauthenticated } from '@/store/authSlice'
import type { EnvState } from '@safe-global/store/settingsSlice'

export type ConnectedWallet = {
  label: string
  chainId: string
  address: string
  ens?: string
  provider: Eip1193Provider
  icon?: string
  balance?: string
  isProposer?: boolean
}

const { getStore, setStore, useStore } = new ExternalStore<OnboardAPI>()

export const initOnboard = async (
  chainConfigs: Chain[],
  currentChain: Chain,
  rpcConfig: EnvState['rpc'] | undefined,
) => {
  const { createOnboard } = await import('@/services/onboard')
  if (!getStore()) {
    console.log('[InitOnboard] Creating onboard instance...')
    try {
      const onboardInstance = createOnboard(chainConfigs, currentChain, rpcConfig)
      setStore(onboardInstance)
      console.log('[InitOnboard] Onboard instance created successfully')
    } catch (e) {
      console.error('[InitOnboard] Error creating onboard instance:', e)
      throw e
    }
  } else {
    console.log('[InitOnboard] Onboard instance already exists')
  }
}

// Get the most recently connected wallet address
export const getConnectedWallet = (wallets: WalletState[]): ConnectedWallet | null => {
  if (!wallets) return null

  const primaryWallet = wallets[0]
  if (!primaryWallet) return null

  const account = primaryWallet.accounts[0]
  if (!account) return null

  let balance = ''
  if (account.balance) {
    const tokenBalance = Object.entries(account.balance)[0]
    const token = tokenBalance?.[0] || ''
    const balanceString = tokenBalance?.[1] || ''
    const balanceNumber = parseFloat(balanceString)
    if (Number.isNaN(balanceNumber)) {
      balance = balanceString
    } else {
      const balanceFormatted = formatAmount(balanceNumber)
      balance = `${balanceFormatted} ${token}`
    }
  }

  try {
    const address = getAddress(account.address)
    return {
      label: primaryWallet.label,
      address,
      ens: account.ens?.name,
      chainId: Number(primaryWallet.chains[0].id).toString(10),
      provider: primaryWallet.provider,
      icon: primaryWallet.icon,
      balance,
      isProposer: false,
    }
  } catch (e) {
    logError(Errors._106, e)
    return null
  }
}

export const getWalletConnectLabel = (wallet: ConnectedWallet): string | undefined => {
  const UNKNOWN_PEER = 'Unknown'
  if (!isWalletConnect(wallet)) return
  const { connector } = wallet.provider as unknown as any
  const peerWalletV2 = connector.session?.peer?.metadata?.name
  return peerWalletV2 || UNKNOWN_PEER
}

export const trackWalletType = (wallet: ConnectedWallet, configs: Chain[]) => {
  const chainInfo = configs.find((config) => config.chainId === wallet.chainId)
  const networkName = chainInfo?.chainName || `Chain ${wallet.chainId}`

  trackEvent(
    { ...WALLET_EVENTS.CONNECT, label: wallet.label },
    {
      [MixpanelEventParams.EOA_WALLET_LABEL]: wallet.label,
      [MixpanelEventParams.EOA_WALLET_ADDRESS]: wallet.address,
      [MixpanelEventParams.EOA_WALLET_NETWORK]: networkName,
    },
  )

  const wcLabel = getWalletConnectLabel(wallet)
  if (wcLabel) {
    trackEvent({
      ...WALLET_EVENTS.WALLET_CONNECT,
      label: wcLabel,
    })
  }
}

let isConnecting = false

// Wrapper that tracks/sets the last used wallet
export const connectWallet = async (
  onboard: OnboardAPI,
  options?: Parameters<OnboardAPI['connectWallet']>[0],
): Promise<WalletState[] | undefined> => {
  if (isConnecting) {
    console.warn('[ConnectWallet] Already connecting, please wait...')
    return
  }

  if (!onboard) {
    console.error('[ConnectWallet] Onboard instance is null')
    return
  }

  isConnecting = true

  let wallets: WalletState[] | undefined

  try {
    console.log('[ConnectWallet] Attempting to connect wallet...')
    wallets = await onboard.connectWallet(options)
    console.log('[ConnectWallet] Wallet connection result:', wallets ? 'success' : 'cancelled')
  } catch (e) {
    console.error('[ConnectWallet] Error connecting wallet:', e)
    logError(Errors._107, e)
    isConnecting = false

    return
  }

  isConnecting = false

  return wallets
}

export const switchWallet = async (onboard: OnboardAPI) => {
  await connectWallet(onboard)
}

const lastWalletStorage = localItem<string>('lastWallet')

const connectLastWallet = async (onboard: OnboardAPI) => {
  const lastWalletLabel = lastWalletStorage.get()
  if (lastWalletLabel) {
    const isUnlocked = await isWalletUnlocked(lastWalletLabel)

    if (isUnlocked === true || isUnlocked === undefined) {
      connectWallet(onboard, {
        autoSelect: { label: lastWalletLabel, disableModals: isUnlocked || false },
      })
    }
  }
}

const saveLastWallet = (walletLabel: string) => {
  lastWalletStorage.set(walletLabel)
}

// Disable/enable wallets according to chain
export const useInitOnboard = () => {
  const { configs } = useChains()
  const chain = useCurrentChain()
  const onboard = useStore()
  const customRpc = useAppSelector(selectRpc)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (configs.length > 0 && chain) {
      console.log('[InitOnboard] Initializing onboard with configs:', configs.length, 'chains, current chain:', chain.chainName)
      void initOnboard(configs, chain, customRpc).then(() => {
        console.log('[InitOnboard] Onboard initialization complete')
      }).catch((e) => {
        console.error('[InitOnboard] Failed to initialize onboard:', e)
      })
    } else {
      if (configs.length === 0) {
        console.warn('[InitOnboard] Waiting for chain configs to load...')
      }
      if (!chain) {
        console.warn('[InitOnboard] Waiting for current chain to be determined...')
      }
    }
  }, [configs, chain, customRpc])

  // Disable unsupported wallets on the current chain
  useEffect(() => {
    if (!onboard || !chain) {
      if (!onboard) console.warn('[InitOnboard] Cannot set wallet modules: onboard not initialized')
      if (!chain) console.warn('[InitOnboard] Cannot set wallet modules: chain not available')
      return
    }

    const enableWallets = async () => {
      const { getSupportedWallets } = await import('@/hooks/wallets/wallets')
      const supportedWallets = getSupportedWallets(chain)
      console.log('[InitOnboard] Setting', supportedWallets.length, 'supported wallet modules for chain:', chain.chainName)
      onboard.state.actions.setWalletModules(supportedWallets)
      console.log('[InitOnboard] Wallet modules set successfully')
    }

    enableWallets().then(() => {
      // Reconnect last wallet
      connectLastWallet(onboard)
    }).catch((e) => {
      console.error('[InitOnboard] Error setting wallet modules:', e)
    })
  }, [chain, onboard])

  // Track connected wallet
  useEffect(() => {
    let lastConnectedWallet = ''
    if (!onboard) return

    const walletSubscription = onboard.state.select('wallets').subscribe((wallets) => {
      const newWallet = getConnectedWallet(wallets)
      if (newWallet) {
        if (newWallet.label !== lastConnectedWallet) {
          lastConnectedWallet = newWallet.label
          saveLastWallet(lastConnectedWallet)
          trackWalletType(newWallet, configs)
        }
      } else if (lastConnectedWallet) {
        lastConnectedWallet = ''
        saveLastWallet(lastConnectedWallet)
        dispatch(setUnauthenticated())
      }
    })

    return () => {
      walletSubscription.unsubscribe()
    }
  }, [onboard, dispatch, configs])
}

export default useStore
