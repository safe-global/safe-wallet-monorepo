import { useEffect, useState } from 'react'
import Onboard, { EIP1193Provider, type OnboardAPI } from '@web3-onboard/core'
import { ChainInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import { hexValue } from '@ethersproject/bytes'
import { getAddress } from '@ethersproject/address'
import { getAllWallets, getRecommendedInjectedWallets, getSupportedWallets } from '@/hooks/wallets/wallets'
import { getRpcServiceUrl } from '@/hooks/wallets/web3'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSession, setLastWallet } from '@/store/sessionSlice'

export type ConnectedWallet = {
  label: string
  chainId: string
  address: string
  ens?: string
  provider: EIP1193Provider
}

const createOnboard = (chainConfigs: ChainInfo[]): OnboardAPI => {
  const wallets = getAllWallets()

  return Onboard({
    wallets,
    chains: chainConfigs.map((cfg) => ({
      id: hexValue(parseInt(cfg.chainId)),
      label: cfg.chainName,
      rpcUrl: getRpcServiceUrl(cfg.rpcUri),
      publicRpcUrl: cfg.publicRpcUri.value,
      token: cfg.nativeCurrency.symbol,
      color: cfg.theme.backgroundColor,
      // TODO: add block explorer URL
    })),
    // TODO: Remove once containerElement is optional again
    accountCenter: {
      mobile: { enabled: true, containerElement: 'body' },
      desktop: { enabled: false, containerElement: 'body' },
    },
    appMetadata: {
      name: 'Gnosis Safe',
      icon: '/logo-no-text.svg',
      description: 'Please select a wallet to connect to Gnosis Safe',
      recommendedInjectedWallets: getRecommendedInjectedWallets(),
    },
  })
}

let onboardSingleton: OnboardAPI | null = null

const initOnboardSingleton = (chainConfigs: ChainInfo[]): OnboardAPI => {
  if (!onboardSingleton) {
    onboardSingleton = createOnboard(chainConfigs)
  }
  return onboardSingleton
}

// Get the most recently connected wallet address
export const getConnectedWallet = (wallets = onboardSingleton?.state.get().wallets): ConnectedWallet | null => {
  if (!wallets) return null

  const primaryWallet = wallets[0]
  if (!primaryWallet) return null

  const account = primaryWallet?.accounts[0]
  if (!account) return null

  return {
    label: primaryWallet.label,
    address: getAddress(account.address),
    ens: account.ens?.name,
    chainId: Number(primaryWallet.chains[0].id).toString(10),
    provider: primaryWallet.provider,
  }
}

// Initialize an onboard singleton when chains are loaded
// Return a cached singleton if already initialized
export const useOnboard = (): OnboardAPI | null => {
  const [onboard, setOnboard] = useState<OnboardAPI | null>(null)
  const { configs } = useChains()

  useEffect(() => {
    if (!configs.length) return

    setOnboard((prev) => prev || initOnboardSingleton(configs))
  }, [configs])

  return onboard
}

// Disable/enable wallets according to chain and cache the last used wallet
export const useInitOnboard = () => {
  const onboard = useOnboard()
  const chain = useCurrentChain()
  const { lastWallet } = useAppSelector(selectSession)
  const dispatch = useAppDispatch()

  // Disable unsupported wallets on the current chain
  useEffect(() => {
    if (onboard && chain?.disabledWallets) {
      const supportedModules = getSupportedWallets(chain.disabledWallets)
      onboard.state.actions.setWalletModules(supportedModules)
    }
  }, [onboard, chain?.disabledWallets])

  // Connect to the last connected wallet
  useEffect(() => {
    if (onboard && lastWallet) {
      onboard.connectWallet({
        autoSelect: { label: lastWallet, disableModals: true },
      })
    }
  }, [onboard, lastWallet])

  // Save the last connected wallet to Redux/local storage
  useEffect(() => {
    if (!onboard) return

    const walletSubscription = onboard.state.select('wallets').subscribe((wallets) => {
      const connectedWallet = getConnectedWallet(wallets)
      dispatch(setLastWallet(connectedWallet?.label || ''))
    })

    return () => {
      walletSubscription.unsubscribe()
    }
  }, [onboard, dispatch])
}

export default useOnboard
