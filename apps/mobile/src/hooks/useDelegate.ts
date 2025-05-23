import { useCallback, useState } from 'react'
import { Wallet } from 'ethers'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { useSign } from './useSign/useSign'
import { selectAllChains } from '@/src/store/chains'
import { addDelegate } from '@/src/store/delegatesSlice'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import Logger from '@/src/utils/logger'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { getDelegateKeyId } from '@/src/utils/delegate'

interface UseDelegateProps {
  createDelegate: (
    ownerPrivateKey: string,
    safe?: string | null,
  ) => Promise<{
    success: boolean
    delegateAddress?: string
    error?: string
  }>
  isLoading: boolean
  error: string | null
}

export const useDelegate = (): UseDelegateProps => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { storePrivateKey } = useSign()

  // Get all available chains
  const allChains = useAppSelector(selectAllChains)

  // Access API endpoints
  const [registerDelegate] = cgwApi.useDelegatesPostDelegateV2Mutation()

  const createDelegate = useCallback(
    async (ownerPrivateKey: string, safe: string | null = null) => {
      try {
        setIsLoading(true)
        setError(null)

        // Create the owner wallet from the provided private key
        const ownerWallet = new Wallet(ownerPrivateKey)
        const ownerAddress = ownerWallet.address

        // Create a random delegate wallet
        const delegateWallet = Wallet.createRandom()
        if (!delegateWallet) {
          setIsLoading(false)
          const errorMsg = 'Failed to create delegate wallet'
          setError(errorMsg)
          return { success: false, error: errorMsg }
        }

        // Store delegate private key in keychain with default protection (no biometrics)
        const delegateKeyId = getDelegateKeyId(ownerAddress, delegateWallet.address)
        const storeSuccess = await storePrivateKey(delegateKeyId, delegateWallet.privateKey, {
          requireAuthentication: false,
        })

        if (!storeSuccess) {
          setIsLoading(false)
          const errorMsg = 'Failed to securely store delegate key'
          setError(errorMsg)
          return { success: false, error: errorMsg }
        }

        // Register on all chains and wait for completion
        const registrationPromises = allChains.map(async (chain, index) => {
          try {
            // Add a delay to avoid 429 rate limiting, staggered by index
            if (index > 0) {
              await new Promise((resolve) => setTimeout(resolve, 300 * index))
            }

            // Generate typed data for this chain
            const typedData = getDelegateTypedData(chain.chainId, delegateWallet.address)

            // Sign the message with the owner's wallet
            const signature = await ownerWallet.signTypedData(typedData.domain, typedData.types, typedData.message)

            // Register delegate on the backend
            await registerDelegate({
              chainId: chain.chainId,
              createDelegateDto: {
                safe,
                delegate: delegateWallet.address,
                delegator: ownerAddress,
                signature,
                label: 'Mobile App Delegate',
              },
            })

            return true
          } catch (error) {
            Logger.error(`Failed to register delegate for chain ${chain.chainId}`, error)
            return false
          }
        })

        // We are not awaiting this as we don't want to block the user from using the app
        Promise.all(registrationPromises)

        // Add to redux store once after all chains are processed
        dispatch(
          addDelegate({
            ownerAddress,
            delegateAddress: delegateWallet.address,
            delegateInfo: {
              safe,
              delegate: delegateWallet.address,
              delegator: ownerAddress,
              label: 'Mobile App Delegate',
            },
          }),
        )

        setIsLoading(false)
        return { success: true, delegateAddress: delegateWallet.address }
      } catch (error) {
        Logger.error('Delegate creation failed', error)
        setIsLoading(false)
        const errorMsg = error instanceof Error ? error.message : String(error)
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    },
    [allChains, dispatch, storePrivateKey, registerDelegate],
  )

  return {
    createDelegate,
    isLoading,
    error,
  }
}

export default useDelegate
