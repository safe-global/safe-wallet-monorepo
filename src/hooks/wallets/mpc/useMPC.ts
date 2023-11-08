import { useEffect } from 'react'
import ExternalStore from '@/services/ExternalStore'
import { COREKIT_STATUS, Web3AuthMPCCoreKit, WEB3AUTH_NETWORK } from '@web3auth/mpc-core-kit'
import { CHAIN_NAMESPACES } from '@web3auth/base'

import { useCurrentChain } from '@/hooks/useChains'
import { getRpcServiceUrl } from '../web3'
import useOnboard, { connectWallet, getConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useInitSocialWallet } from './useSocialWallet'
import { ONBOARD_MPC_MODULE_LABEL } from '@/services/mpc/SocialLoginModule'
import { isSocialWalletOptions, SOCIAL_WALLET_OPTIONS } from '@/services/mpc/config'
import { IS_PRODUCTION } from '@/config/constants'

const { getStore, setStore, useStore } = new ExternalStore<Web3AuthMPCCoreKit>()

export const useInitMPC = () => {
  const chain = useCurrentChain()
  const onboard = useOnboard()
  useInitSocialWallet()

  useEffect(() => {
    if (!chain || !onboard || !isSocialWalletOptions(SOCIAL_WALLET_OPTIONS)) {
      return
    }

    const chainConfig = {
      chainId: `0x${Number(chain.chainId).toString(16)}`,
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      rpcTarget: getRpcServiceUrl(chain.rpcUri),
      displayName: chain.chainName,
      blockExplorer: new URL(chain.blockExplorerUriTemplate.address).origin,
      ticker: chain.nativeCurrency.symbol,
      tickerName: chain.nativeCurrency.name,
    }

    const currentInstance = getStore()
    let previousChainChangedListeners: Function[] = []
    if (currentInstance?.provider) {
      // We are already connected. We copy onboards event listener for the chainChanged event to propagate a potentially new chainId
      const oldProvider = currentInstance.provider
      previousChainChangedListeners = oldProvider.listeners('chainChanged')
    }

    const web3AuthCoreKit = new Web3AuthMPCCoreKit({
      web3AuthClientId: SOCIAL_WALLET_OPTIONS.web3AuthClientId,
      // Available networks are "sapphire_devnet", "sapphire_mainnet"
      web3AuthNetwork: WEB3AUTH_NETWORK.MAINNET,
      baseUrl: `${window.location.origin}/`,
      uxMode: 'popup',
      enableLogging: !IS_PRODUCTION,
      chainConfig,
      manualSync: true,
      hashedFactorNonce: 'safe-global-sfa-nonce',
    })

    web3AuthCoreKit
      .init()
      .then(() => {
        setStore(web3AuthCoreKit)
        // If rehydration was successful, connect to onboard
        if (web3AuthCoreKit.status !== COREKIT_STATUS.LOGGED_IN || !web3AuthCoreKit.provider) {
          return
        }
        const connectedWallet = getConnectedWallet(onboard.state.get().wallets)
        if (!connectedWallet) {
          connectWallet(onboard, {
            autoSelect: {
              label: ONBOARD_MPC_MODULE_LABEL,
              disableModals: true,
            },
          }).catch((reason) => console.error('Error connecting to MPC module:', reason))
        } else {
          const newProvider = web3AuthCoreKit.provider

          // To propagate the changedChain we disconnect and connect
          if (previousChainChangedListeners.length > 0 && newProvider) {
            previousChainChangedListeners.forEach((previousListener) =>
              newProvider.addListener('chainChanged', (...args: []) => previousListener(...args)),
            )
            newProvider.emit('chainChanged', `0x${Number(chainConfig.chainId).toString(16)}`)
          }
        }
      })
      .catch((error) => console.error(error))
  }, [chain, onboard])
}

export const _getMPCCoreKitInstance = getStore

export const setMPCCoreKitInstance = setStore

export default useStore
