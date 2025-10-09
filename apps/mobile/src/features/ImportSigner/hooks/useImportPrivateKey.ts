import { ethers } from 'ethers'
import { useState } from 'react'
import Clipboard from '@react-native-clipboard/clipboard'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import useDelegate from '@/src/hooks/useDelegate'
import Logger from '@/src/utils/logger'
import { detectInputType, InputType } from '@/src/utils/inputDetection'

const ERROR_MESSAGE = 'Invalid private key or seed phrase.'
export const useImportPrivateKey = () => {
  const [input, setInput] = useState('')
  const [inputType, setInputType] = useState<InputType>('unknown')
  const [wallet, setWallet] = useState<ethers.Wallet>()
  const local = useLocalSearchParams<{ safeAddress: string; chainId: string; import_safe: string }>()
  const [error, setError] = useState<string | undefined>(undefined)
  const router = useRouter()
  const { createDelegate } = useDelegate()

  const handleInputChange = (text: string) => {
    setInput(text)
    const detectedType = detectInputType(text)
    setInputType(detectedType)

    if (detectedType === 'private-key') {
      try {
        const wallet = new ethers.Wallet(text.trim())
        setWallet(wallet)
        setError(undefined)
      } catch {
        setError(ERROR_MESSAGE)
      }
    } else if (detectedType === 'seed-phrase') {
      try {
        // For seed phrase, we'll validate it can create a wallet
        // Trim the input to handle leading/trailing whitespace
        ethers.Wallet.fromPhrase(text.trim())
        setWallet(undefined) // Clear wallet since we'll show address selection
        setError(undefined)
      } catch {
        setError(ERROR_MESSAGE)
      }
    } else {
      setWallet(undefined)
      setError(text.length > 0 ? ERROR_MESSAGE : undefined)
    }
  }

  const handleImport = async () => {
    setError(undefined)

    const trimmedInput = input.trim()

    if (inputType === 'private-key' && wallet) {
      // Handle private key import (existing flow)
      try {
        // Store the private key
        await storePrivateKey(wallet.address, trimmedInput)

        // Create a delegate for this owner
        try {
          // We don't want to fail the private key import if delegate creation fails
          // by passing null as the safe address, we are creating a delegate for the chain and not for the safe
          const delegateResult = await createDelegate(trimmedInput, null)

          if (!delegateResult.success) {
            Logger.error('Failed to create delegate during private key import', delegateResult.error)
          }
        } catch (delegateError) {
          // Log the error but continue with the import
          Logger.error('Error creating delegate during private key import', delegateError)
        }

        // Continue with normal flow
        router.push({
          pathname: '/import-signers/loading',
          params: {
            address: wallet.address,
            safeAddress: local.safeAddress,
            chainId: local.chainId,
            import_safe: local.import_safe,
          },
        })
      } catch (err) {
        setError((err as Error).message)
      }
    } else if (inputType === 'seed-phrase') {
      // Navigate to address selection screen for seed phrase
      router.push({
        pathname: '/import-signers/seed-phrase-addresses',
        params: {
          seedPhrase: trimmedInput,
          safeAddress: local.safeAddress,
          chainId: local.chainId,
          import_safe: local.import_safe,
        },
      })
    } else {
      setError(ERROR_MESSAGE)
    }
  }

  const onInputPaste = async () => {
    const text = await Clipboard.getString()
    handleInputChange(text.trim())
  }

  return {
    handleInputChange,
    handleImport,
    onInputPaste,
    input,
    inputType,
    wallet,
    error,
  }
}
