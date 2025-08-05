import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type Safe from '@safe-global/protocol-kit'
import { SafeProvider, SigningMethod } from '@safe-global/protocol-kit'
import {
  generatePreValidatedSignature,
  isSafeMultisigTransactionResponse,
  sameString,
} from '@safe-global/protocol-kit/dist/src/utils'
import type { Eip1193Provider, JsonRpcSigner } from 'ethers'
import { isHardwareWallet, isWalletConnect } from '@/utils/wallets'
import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import { getChainConfig } from '@safe-global/safe-gateway-typescript-sdk'
import { createWeb3, getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { toQuantity } from 'ethers'
import { connectWallet, getConnectedWallet } from '@/hooks/wallets/useOnboard'
import { type OnboardAPI } from '@web3-onboard/core'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { UncheckedJsonRpcSigner } from '@/utils/providers/UncheckedJsonRpcSigner'
import get from 'lodash/get'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export const getAndValidateSafeSDK = (): Safe => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error(
      'The Safe SDK could not be initialized. Please be aware that we only support v1.0.0 Safe Accounts and up.',
    )
  }
  return safeSDK
}

export const getSafeProvider = () => {
  const provider = getWeb3ReadOnly()
  if (!provider) {
    throw new Error('Provider not found.')
  }

  return new SafeProvider({ provider: provider._getConnection().url })
}

async function switchOrAddChain(walletProvider: ConnectedWallet['provider'], chainId: string): Promise<void> {
  const UNKNOWN_CHAIN_ERROR_CODE = 4902
  const hexChainId = toQuantity(parseInt(chainId))

  try {
    return await walletProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    })
  } catch (error) {
    const errorCode = get(error, 'code') as number | undefined

    // Rabby emits the same error code as MM, but it is nested
    const nestedErrorCode = get(error, 'data.originalError.code') as number | undefined

    if (errorCode === UNKNOWN_CHAIN_ERROR_CODE || nestedErrorCode === UNKNOWN_CHAIN_ERROR_CODE) {
      const chain = await getChainConfig(chainId)

      return walletProvider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            chainName: chain.chainName,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [chain.publicRpcUri.value],
            blockExplorerUrls: [new URL(chain.blockExplorerUriTemplate.address).origin],
          },
        ],
      })
    }

    throw error
  }
}

export const switchWalletChain = async (onboard: OnboardAPI, chainId: string): Promise<ConnectedWallet | null> => {
  const currentWallet = getConnectedWallet(onboard.state.get().wallets)
  if (!currentWallet) return null

  // Onboard incorrectly returns WalletConnect's chainId, so it needs to be switched unconditionally
  if (currentWallet.chainId === chainId && !isWalletConnect(currentWallet)) {
    return currentWallet
  }

  // Hardware wallets cannot switch chains
  if (isHardwareWallet(currentWallet)) {
    await onboard.disconnectWallet({ label: currentWallet.label })
    const wallets = await connectWallet(onboard, { autoSelect: currentWallet.label })
    return wallets ? getConnectedWallet(wallets) : null
  }

  // Onboard doesn't update immediately and otherwise returns a stale wallet if we directly get its state
  return new Promise((resolve) => {
    const source$ = onboard.state.select('wallets').subscribe((newWallets) => {
      const newWallet = getConnectedWallet(newWallets)
      if (newWallet && newWallet.chainId === chainId) {
        source$.unsubscribe()
        resolve(newWallet)
      }
    })

    // Switch chain for all other wallets
    switchOrAddChain(currentWallet.provider, chainId).catch(() => {
      source$.unsubscribe()
      resolve(currentWallet)
    })
  })
}

export const assertWalletChain = async (onboard: OnboardAPI, chainId: string): Promise<ConnectedWallet> => {
  const wallet = getConnectedWallet(onboard.state.get().wallets)

  if (!wallet) {
    throw new Error('No wallet connected.')
  }

  const newWallet = await switchWalletChain(onboard, chainId)

  if (!newWallet) {
    throw new Error('No wallet connected.')
  }

  if (newWallet.chainId !== chainId) {
    throw new Error('Wallet connected to wrong chain.')
  }

  return newWallet
}

export const getAssertedChainSigner = async (provider: Eip1193Provider): Promise<JsonRpcSigner> => {
  const browserProvider = createWeb3(provider)
  return browserProvider.getSigner()
}

export const getUncheckedSigner = async (provider: Eip1193Provider) => {
  const browserProvider = createWeb3(provider)
  return new UncheckedJsonRpcSigner(browserProvider, (await browserProvider.getSigner()).address)
}

export const getSafeSDKWithSigner = async (provider: Eip1193Provider): Promise<Safe> => {
  const sdk = getAndValidateSafeSDK()

  return sdk.connect({ provider })
}

export const tryOffChainTxSigning = async (safeTx: SafeTransaction, sdk: Safe): Promise<SafeTransaction> => {
  return sdk.signTransaction(safeTx, SigningMethod.ETH_SIGN_TYPED_DATA)
}

export const isDelegateCall = (safeTx: SafeTransaction): boolean => {
  return safeTx.data.operation === OperationType.DelegateCall
}

// TODO: This is a workaround and a duplication of sdk.executeTransaction but it returns the encoded tx instead of executing it.
export const prepareTxExecution = async (safeTransaction: SafeTransaction, provider: Eip1193Provider) => {
  const sdk = await getSafeSDKWithSigner(provider)

  if (!sdk.getContractManager().safeContract) {
    throw new Error('Safe is not deployed')
  }

  const transaction = isSafeMultisigTransactionResponse(safeTransaction)
    ? await sdk.toSafeTransactionType(safeTransaction)
    : safeTransaction

  const signedSafeTransaction = await sdk.copyTransaction(transaction)

  const txHash = await sdk.getTransactionHash(signedSafeTransaction)
  const ownersWhoApprovedTx = await sdk.getOwnersWhoApprovedTx(txHash)
  for (const owner of ownersWhoApprovedTx) {
    signedSafeTransaction.addSignature(generatePreValidatedSignature(owner))
  }
  const owners = await sdk.getOwners()
  const threshold = await sdk.getThreshold()
  const signerAddress = await sdk.getSafeProvider().getSignerAddress()
  if (threshold > signedSafeTransaction.signatures.size && signerAddress && owners.includes(signerAddress)) {
    signedSafeTransaction.addSignature(generatePreValidatedSignature(signerAddress))
  }

  if (threshold > signedSafeTransaction.signatures.size) {
    const signaturesMissing = threshold - signedSafeTransaction.signatures.size
    throw new Error(
      `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${maybePlural(
        signaturesMissing,
      )} missing`,
    )
  }

  const value = BigInt(signedSafeTransaction.data.value)
  if (value !== 0n) {
    const balance = await sdk.getBalance()
    if (value > balance) {
      throw new Error('Not enough Ether funds')
    }
  }

  return sdk.getEncodedTransaction(signedSafeTransaction)
}

// TODO: This is a duplication of sdk.approveTransactionHash but it returns the encoded tx instead of executing it.
export const prepareApproveTxHash = async (hash: string, provider: Eip1193Provider) => {
  const sdk = await getSafeSDKWithSigner(provider)

  const safeContract = sdk.getContractManager().safeContract

  if (!safeContract) {
    throw new Error('Safe is not deployed')
  }

  const owners = await sdk.getOwners()
  const signerAddress = await sdk.getSafeProvider().getSignerAddress()
  if (!signerAddress) {
    throw new Error('SafeProvider must be initialized with a signer to use this method')
  }
  const addressIsOwner = owners.some((owner: string) => signerAddress && sameString(owner, signerAddress))
  if (!addressIsOwner) {
    throw new Error('Transaction hashes can only be approved by Safe owners')
  }

  // @ts-ignore
  return safeContract.encode('approveHash', [hash])
}
