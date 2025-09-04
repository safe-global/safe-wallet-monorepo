import { ethers } from 'ethers'
import { useState } from 'react'
import Clipboard from '@react-native-clipboard/clipboard'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import useDelegate from '@/src/hooks/useDelegate'
import Logger from '@/src/utils/logger'

const ERROR_MESSAGE = 'Invalid private key.'
export const useImportPrivateKey = () => {
  const [privateKey, setPrivateKey] = useState('')
  const [wallet, setWallet] = useState<ethers.Wallet>()
  const local = useLocalSearchParams<{ safeAddress: string; chainId: string; import_safe: string }>()
  const [error, setError] = useState<string>()
  const router = useRouter()
  const { createDelegate } = useDelegate()

  const handlePrivateKeyChange = (text: string) => {
    setPrivateKey(text)
    try {
      const wallet = new ethers.Wallet(text)
      setWallet(wallet)
      setError(undefined)
    } catch {
      setError(ERROR_MESSAGE)
    }
  }

  const handleImport = async () => {
    if (!wallet) {
      return setError(ERROR_MESSAGE)
    }

    try {
      // Store the private key
      await storePrivateKey(wallet.address, privateKey)

      // Create a delegate for this owner
      try {
        // We don't want to fail the private key import if delegate creation fails
        // by passing null as the safe address, we are creating a delegate for the chain and not for the safe
        const delegateResult = await createDelegate(privateKey, null)

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
  }

  const onPrivateKeyPaste = async () => {
    const text = await Clipboard.getString()
    handlePrivateKeyChange(text.trim())
  }

  return { handlePrivateKeyChange, handleImport, onPrivateKeyPaste, privateKey, wallet, error }
}
