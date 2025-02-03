import { ethers } from 'ethers'
import { useState } from 'react'
import Clipboard from '@react-native-clipboard/clipboard'
import { useSign } from '@/src/hooks/useSign'
import { useRouter } from 'expo-router'

const ERROR_MESSAGE = 'Invalid private key.'
export const useImportPrivateKey = () => {
  const [privateKey, setPrivateKey] = useState('')
  const [wallet, setWallet] = useState<ethers.Wallet>()
  const [error, setError] = useState<string>()
  const { storePrivateKey } = useSign()
  const router = useRouter()

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
      await storePrivateKey(wallet.address, privateKey)
      router.push({
        pathname: '/import-signers/loading',
        params: {
          address: wallet.address,
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
