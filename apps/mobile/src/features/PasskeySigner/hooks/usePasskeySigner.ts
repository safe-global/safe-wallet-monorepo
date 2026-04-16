import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { removeSigner } from '@/src/store/signersSlice'
import { addSignerWithEffects } from '@/src/store/signerThunks'
import {
  getPasskeyMetadata,
  storePasskeyMetadata,
  removePasskeyMetadata,
  PasskeyMetadata,
} from '@/src/services/passkey/passkey-storage.service'
import { createPasskey } from '@/src/services/passkey/passkey.service'
import { createPasskeySigner, getIdentityAddress } from '@/src/services/passkey/identity-contract.service'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import logger from '@/src/utils/logger'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getAddress } from 'ethers'

interface UsePasskeySignerReturn {
  passkeyMetadata: PasskeyMetadata | null
  isLoading: boolean
  error: string | null
  create: () => Promise<void>
  remove: () => Promise<void>
}

export function usePasskeySigner(): UsePasskeySignerReturn {
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const [passkeyMetadata, setPasskeyMetadata] = useState<PasskeyMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load passkey metadata on mount
  useEffect(() => {
    getPasskeyMetadata().then(setPasskeyMetadata)
  }, [])

  const create = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Create passkey via WebAuthn
      const credential = await createPasskey()
      if (!credential) {
        throw new Error('Passkey creation cancelled')
      }

      // 2. Create signer from credential
      const signer = await createPasskeySigner(credential)

      // 3. Derive identity contract address using protocol-kit
      const rawAddress = await getIdentityAddress(signer, activeSafe.address, activeChain)
      // Normalize to checksummed format to match CGW owner addresses
      const address = getAddress(rawAddress) as `0x${string}`

      // 4. Store metadata in keychain
      const metadata: PasskeyMetadata = {
        rawId: signer.rawId,
        coordinates: signer.coordinates,
        identityContractAddress: address,
        deployedOnChains: [],
      }
      await storePasskeyMetadata(metadata)
      setPasskeyMetadata(metadata)

      // 5. Add to Redux store + set as active signer + add to address book
      dispatch(
        addSignerWithEffects({
          value: address,
          name: null,
          logoUri: null,
          type: 'passkey',
          rawId: signer.rawId,
        }),
      )

      logger.info('Passkey signer created with identity address:', address)
    } catch (err) {
      const message = asError(err).message
      logger.error('Failed to create passkey:', message)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, activeSafe.address, activeChain])

  const remove = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (passkeyMetadata) {
        dispatch(removeSigner(passkeyMetadata.identityContractAddress))
        await removePasskeyMetadata()
        setPasskeyMetadata(null)
      }
    } catch (err) {
      const message = asError(err).message
      logger.error('Failed to remove passkey:', message)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, passkeyMetadata])

  return { passkeyMetadata, isLoading, error, create, remove }
}
