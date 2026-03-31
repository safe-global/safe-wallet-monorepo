import React, { useCallback, useEffect, useRef } from 'react'
import { ScrollView } from 'react-native'
import Seed from '@/assets/images/seed.png'
import Wallet from '@/assets/images/wallet.png'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle, SectionTitle } from '@/src/components/Title'
import { SafeCard } from '@/src/components/SafeCard'
import { router } from 'expo-router'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { View, Image } from 'tamagui'
import { useAppDispatch } from '@/src/store/hooks'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useWalletConnect } from '@/src/features/WalletConnect/hooks/useWalletConnect'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import Logger from '@/src/utils/logger'

const ConnectWalletAppImage = () => {
  const { isDark } = useTheme()
  const image = isDark
    ? require('@/assets/images/connect-wallet-app-dark.png')
    : require('@/assets/images/connect-wallet-app-light.png')
  return <Image src={image} objectFit="contain" width={300} height={80} />
}

const items = [
  {
    name: 'seed',
    title: 'Import using private key',
    description: 'Store a private key on this device to sign transactions.',
    icon: <SafeFontIcon name="keyboard" size={16} />,
    Image: Seed,
    imageProps: { marginBottom: -31 },
  },
  {
    name: 'hardwareSigner',
    title: 'Connect hardware device',
    description: 'Connect hardware device to sign transactions.',
    icon: <SafeFontIcon name="hardware" size={16} />,
    Image: Wallet,
    imageProps: { marginBottom: -32 },
  },
  {
    name: 'connectSigner',
    title: 'Connect wallet app',
    description: 'Connect an external wallet app to sign transactions.',
    icon: <SafeFontIcon name="dapp-logo" size={16} />,
    Image: <ConnectWalletAppImage />,
    imageProps: { marginBottom: -32 },
  },
] as const

const title = 'Add signer'

export const ImportSignersContainer = () => {
  const { isBiometricsEnabled } = useBiometrics()
  const dispatch = useAppDispatch()
  const { open: openWalletConnect, isConnected, address, walletInfo } = useWalletConnect()
  const registeredRef = useRef<string | null>(null)
  const connectInitiatedRef = useRef(false)
  const { validateAddressOwnership } = useAddressOwnershipValidation()

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  // Validate ownership then navigate when the user initiates a new connection
  useEffect(() => {
    if (
      !connectInitiatedRef.current ||
      !isConnected ||
      !address ||
      !walletInfo ||
      sameAddress(registeredRef.current ?? undefined, address)
    ) {
      return
    }

    registeredRef.current = address
    connectInitiatedRef.current = false

    const checksumAddress = getAddress(address)
    let cancelled = false

    const validateAndNavigate = async () => {
      try {
        const result = await validateAddressOwnership(checksumAddress)

        if (cancelled) return

        if (result.isOwner) {
          router.push({
            pathname: '/import-signers/name-signer',
            params: {
              address: checksumAddress,
              walletName: walletInfo.name ?? '',
            },
          })
        } else {
          router.push({
            pathname: '/import-signers/connect-signer-error',
            params: { address: checksumAddress },
          })
        }
      } catch (error) {
        if (cancelled) return

        Logger.error('Error validating signer ownership:', error)
        router.push({
          pathname: '/import-signers/connect-signer-error',
          params: { address: checksumAddress },
        })
      }
    }

    validateAndNavigate()

    return () => {
      cancelled = true
    }
  }, [isConnected, address, walletInfo, validateAddressOwnership])

  // Reset guard when wallet disconnects so reconnection triggers navigation
  useEffect(() => {
    if (!isConnected) {
      registeredRef.current = null
    }
  }, [isConnected])

  const handleConnectSigner = useCallback(
    (name: (typeof items)[number]['name']) => {
      const actions: Record<(typeof items)[number]['name'], () => void> = {
        seed: () =>
          router.push(
            isBiometricsEnabled
              ? '/import-signers/signer'
              : { pathname: '/biometrics-opt-in', params: { caller: '/import-signers' } },
          ),
        hardwareSigner: () => router.push('/import-signers/hardware-devices'),
        connectSigner: () => {
          connectInitiatedRef.current = true
          openWalletConnect()
        },
      }

      actions[name]()
    },
    [isBiometricsEnabled, openWalletConnect],
  )

  return (
    <View flex={1}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle title={title} description="Select how you'd like to add your signer." />

        {items.map((item, index) => (
          <SafeCard
            testID={item.name}
            onPress={() => handleConnectSigner(item.name)}
            key={`${item.name}-${index}`}
            title={item.title}
            description={item.description}
            icon={item.icon}
            image={item.Image}
            imageProps={item.imageProps}
          />
        ))}
      </ScrollView>
    </View>
  )
}
