import { useMemo } from 'react'
import type { JsonRpcProvider } from 'ethers'
import { useRouter } from 'next/router'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { getNestedWallet, type ChosenParentSafeNonce } from '@/utils/nested-safe-wallet'
import type { SignerWallet } from './WalletContext'

type SignerWalletInput = {
  wallet: ConnectedWallet | null
  // The address picked in "Sign with"; a parent Safe when it differs from the wallet
  signerAddress: string | undefined
  // The chain the signer acts on, and its read-only provider
  chainId: string | undefined
  web3ReadOnly: JsonRpcProvider | undefined
  chosenNonce: ChosenParentSafeNonce
}

/** The signer for `chainId`: the picked parent Safe, the connected wallet as a Safe, or the wallet itself. */
export const useSignerWallet = ({
  wallet,
  signerAddress,
  chainId,
  web3ReadOnly,
  chosenNonce,
}: SignerWalletInput): SignerWallet | ConnectedWallet | null => {
  const router = useRouter()
  const { get: getParentSafeNonce, clear: clearParentSafeNonce } = chosenNonce

  const { currentData: nestedSafeInfo } = useSafesGetSafeV1Query(
    { chainId: chainId || '', safeAddress: signerAddress || '' },
    {
      skip: !signerAddress || !chainId || sameAddress(signerAddress, wallet?.address || ''),
    },
  )

  // Chain-gated so a same-address Safe on another chain isn't misdetected
  const { currentData: connectedSafeInfo } = useSafesGetSafeV1Query(
    { chainId: chainId || '', safeAddress: wallet?.address || '' },
    {
      skip: !wallet?.address || !chainId || wallet.chainId !== chainId,
    },
  )

  return useMemo(() => {
    if (wallet && nestedSafeInfo && web3ReadOnly) {
      return getNestedWallet(wallet, nestedSafeInfo, web3ReadOnly, router, {
        get: getParentSafeNonce,
        clear: clearParentSafeNonce,
      })
    }
    if (wallet && connectedSafeInfo) {
      return { ...wallet, isConnectedSafe: true as const, threshold: connectedSafeInfo.threshold }
    }
    return wallet
  }, [wallet, nestedSafeInfo, connectedSafeInfo, web3ReadOnly, router, getParentSafeNonce, clearParentSafeNonce])
}
