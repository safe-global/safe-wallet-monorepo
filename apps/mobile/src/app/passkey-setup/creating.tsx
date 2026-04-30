import React, { useEffect, useRef } from 'react'
import { Text, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { ActivityIndicator } from 'react-native'
import { usePasskeySetup } from '@/src/features/PasskeySetup/context/PasskeySetupProvider'
import { addPasskeyMetadata } from '@/src/services/passkey/passkey-storage.service'
import { useAppDispatch } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signerThunks'
import { deriveIdentityAddress } from '@safe-global/utils/services/passkey'
import logger from '@/src/utils/logger'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getAddress } from 'ethers'
import { useTheme } from 'tamagui'

// POC: precompute the identity address on Sepolia for the Redux signer key
// (signersSlice keys by address — see plan F5 deferred). Per-chain proxy
// addresses are derived lazily at signing time by shared `signSafeTxWithPasskey`
// and cached into `metadata.identityContractAddresses[chainId]`.
const POC_DERIVATION_CHAIN_ID = '11155111'
const POC_DERIVATION_RPC_URL = 'https://sepolia.gateway.tenderly.co'

export default function PasskeyCreatingScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const { credential, rawId, name, setIdentityAddress, setError } = usePasskeySetup()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current || !credential || !rawId) {
      return
    }
    hasStarted.current = true

    const run = async () => {
      try {
        // 1. Derive identity contract address via shared factory view call
        const rawAddress = await deriveIdentityAddress({
          rpcUrl: POC_DERIVATION_RPC_URL,
          chainId: POC_DERIVATION_CHAIN_ID,
          coordinates: credential.coordinates,
        })
        const address = getAddress(rawAddress) as `0x${string}`
        setIdentityAddress(address)

        // 2. Persist full metadata to Keychain
        await addPasskeyMetadata({
          rawId,
          coordinates: credential.coordinates,
          identityContractAddresses: { [POC_DERIVATION_CHAIN_ID]: address },
          deployedOnChains: [],
          name,
        })

        // 3. Add signer to Redux store
        await dispatch(
          addSignerWithEffects({
            value: address,
            name,
            logoUri: null,
            type: 'passkey',
            rawId,
          }),
        )

        logger.info('Passkey signer created with identity address:', address)

        router.replace('/passkey-setup/success')
      } catch (err) {
        const message = asError(err).message
        logger.error('Failed to create passkey signer:', message)
        setError(message)
        router.replace('/passkey-setup/error')
      }
    }

    run()
  }, [credential, rawId])

  return (
    <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
      <YStack gap="$4" alignItems="center">
        <ActivityIndicator size="large" color={theme.primary.get()} />
        <Text fontSize="$5" fontWeight={600}>
          Creating your passkey..
        </Text>
      </YStack>
    </YStack>
  )
}
