import { useState, useCallback } from 'react'
import { HDNodeWallet } from 'ethers'
import { keyStorageService, walletService, PrivateKeyStorageOptions } from '@/src/services/key-storage'
import Logger from '@/src/utils/logger'

export const useSign = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storePrivateKey = useCallback(
    async (
      userId: string,
      privateKey: string,
      options: PrivateKeyStorageOptions = { requireAuthentication: true },
    ): Promise<boolean> => {
      setIsLoading(true)
      setError(null)
      try {
        await keyStorageService.storePrivateKey(userId, privateKey, options)
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to store private key'
        setError(errorMessage)
        Logger.error('storePrivateKey', { userId, error: errorMessage })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const getPrivateKey = useCallback(
    async (
      userId: string,
      options: PrivateKeyStorageOptions = { requireAuthentication: true },
    ): Promise<string | undefined> => {
      setIsLoading(true)
      setError(null)
      try {
        return await keyStorageService.getPrivateKey(userId, options)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get private key'
        setError(errorMessage)
        Logger.error('getPrivateKey', { userId, error: errorMessage })
        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const createMnemonicAccount = useCallback(async (mnemonic: string): Promise<HDNodeWallet | undefined> => {
    setIsLoading(true)
    setError(null)
    try {
      return await walletService.createMnemonicAccount(mnemonic)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mnemonic account'
      setError(errorMessage)
      Logger.error('createMnemonicAccount', { error: errorMessage })
      return undefined
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    storePrivateKey,
    getPrivateKey,
    createMnemonicAccount,
    isLoading,
    error,
  }
}

// For backward compatibility, also export the functions directly (for now)
export const storePrivateKey = keyStorageService.storePrivateKey.bind(keyStorageService)
export const getPrivateKey = keyStorageService.getPrivateKey.bind(keyStorageService)
export const createMnemonicAccount = walletService.createMnemonicAccount.bind(walletService)
