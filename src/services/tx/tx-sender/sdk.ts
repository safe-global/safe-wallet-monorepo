import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type Safe from '@safe-global/protocol-kit'
import { EthersAdapter, SigningMethod } from '@safe-global/protocol-kit'
import type { JsonRpcSigner } from 'ethers'
import { ethers } from 'ethers'
import { isWalletRejection, isHardwareWallet, isWalletConnect } from '@/utils/wallets'
import { OperationType, type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { SAFE_FEATURES } from '@safe-global/protocol-kit/dist/src/utils/safeVersions'
import { hasSafeFeature } from '@/utils/safe-versions'
import { createWeb3 } from '@/hooks/wallets/web3'
import { toQuantity } from 'ethers'
import { connectWallet, getConnectedWallet } from '@/hooks/wallets/useOnboard'
import { type OnboardAPI } from '@web3-onboard/core'
import { asError } from '@/services/exceptions/utils'
import { UncheckedJsonRpcSigner } from '@/utils/providers/UncheckedJsonRpcSigner'
import { ConnectedWallet } from '@privy-io/react-auth'

export const getAndValidateSafeSDK = (): Safe => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error(
      'The Safe SDK could not be initialized. Please be aware that we only support v1.0.0 Safe Accounts and up.',
    )
  }
  return safeSDK
}

export const switchWalletChain = async (wallet: ConnectedWallet, chainId: string): Promise<ConnectedWallet | null> => {
  if (!wallet) return null

  // Onboard incorrectly returns WalletConnect's chainId, so it needs to be switched unconditionally
  if (wallet.chainId === chainId) {
    return wallet
  }

  // Hardware wallets cannot switch chains
  // if (isHardwareWallet(currentWallet)) {
  //   await onboard.disconnectWallet({ label: currentWallet.label })
  //   const wallets = await connectWallet(onboard, { autoSelect: currentWallet.label })
  //   return wallets ? getConnectedWallet(wallets) : null
  // }

  // Onboard doesn't update immediately and otherwise returns a stale wallet if we directly get its state
  return new Promise((resolve) => {
    // const source$ = onboard.state.select('wallets').subscribe((newWallets) => {
    //   const newWallet = getConnectedWallet(newWallets)
    //   if (newWallet && newWallet.chainId === chainId) {
    //     source$.unsubscribe()
    //     resolve(newWallet)
    //   }
    // })

    // Switch chain for all other wallets
    wallet.provider
      .request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toQuantity(parseInt(chainId)) }],
      })
      .catch(() => {
        resolve(wallet)
      })
  })
}

export const assertWalletChain = async (wallet: ConnectedWallet, chainId: string): Promise<ConnectedWallet> => {
  if (!wallet) {
    throw new Error('No wallet connected.')
  }

  const newWallet = await switchWalletChain(wallet, chainId)

  if (!newWallet) {
    throw new Error('No wallet connected.')
  }

  if (newWallet.chainId !== chainId) {
    throw new Error('Wallet connected to wrong chain.')
  }

  return newWallet
}

export const getAssertedChainSigner = async (
  _wallet: ConnectedWallet,
  chainId: SafeInfo['chainId'],
): Promise<JsonRpcSigner> => {
  const wallet = await assertWalletChain(_wallet, chainId)
  const provider = createWeb3(wallet.provider)
  return provider.getSigner()
}

/**
 * https://docs.ethers.io/v5/api/providers/jsonrpc-provider/#UncheckedJsonRpcSigner
 * This resolves the promise sooner when executing a tx and mocks
 * most of the values of transactionResponse which is needed when
 * dealing with smart-contract wallet owners
 */
export const getUncheckedSafeSDK = async (_wallet: ConnectedWallet, chainId: SafeInfo['chainId']): Promise<Safe> => {
  const signer = await getAssertedChainSigner(_wallet, chainId)
  const uncheckedJsonRpcSigner = new UncheckedJsonRpcSigner(signer.provider, await signer.getAddress())
  const sdk = getAndValidateSafeSDK()

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: uncheckedJsonRpcSigner,
  })

  return sdk.connect({ ethAdapter })
}

export const getSafeSDKWithSigner = async (onboard: OnboardAPI, chainId: SafeInfo['chainId']): Promise<Safe> => {
  const signer = await getAssertedChainSigner(onboard, chainId)
  const sdk = getAndValidateSafeSDK()

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  })

  return sdk.connect({ ethAdapter })
}

export const getSupportedSigningMethods = (safeVersion: SafeInfo['version']): SigningMethod[] => {
  if (!hasSafeFeature(SAFE_FEATURES.ETH_SIGN, safeVersion)) {
    return [SigningMethod.ETH_SIGN_TYPED_DATA]
  }

  return [SigningMethod.ETH_SIGN_TYPED_DATA, SigningMethod.ETH_SIGN]
}

export const tryOffChainTxSigning = async (
  safeTx: SafeTransaction,
  safeVersion: SafeInfo['version'],
  sdk: Safe,
): Promise<SafeTransaction> => {
  const signingMethods = getSupportedSigningMethods(safeVersion)

  for await (const [i, signingMethod] of signingMethods.entries()) {
    try {
      return await sdk.signTransaction(safeTx, signingMethod)
    } catch (error) {
      const isLastSigningMethod = i === signingMethods.length - 1

      if (isWalletRejection(asError(error)) || isLastSigningMethod) {
        throw error
      }
    }
  }

  // Won't be reached, but TS otherwise complains
  throw new Error('No supported signing methods')
}

export const isDelegateCall = (safeTx: SafeTransaction): boolean => {
  return safeTx.data.operation === OperationType.DelegateCall
}
