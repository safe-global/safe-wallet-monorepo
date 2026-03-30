import React, { useCallback, useEffect, useRef } from 'react'
import { ScrollView } from 'react-native'
import Seed from '@/assets/images/seed.png'
import Wallet from '@/assets/images/wallet.png'
import ConnectWalletApp from '@/assets/images/connect-wallet-app.png'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle, SectionTitle } from '@/src/components/Title'
import { SafeCard } from '@/src/components/SafeCard'
import { router } from 'expo-router'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { View, Image } from 'tamagui'
import { useAppDispatch } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signerThunks'
import { getAddress } from 'ethers'
import { useWalletConnect } from '@/src/features/WalletConnect/hooks/useWalletConnect'

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
    Image: ConnectWalletApp,
    imageProps: { marginBottom: -32 },
  },
] as const

const title = 'Add signer'

export const ImportSignersContainer = () => {
  const { isBiometricsEnabled } = useBiometrics()
  const dispatch = useAppDispatch()
  const { open: openWalletConnect, isConnected, address, walletInfo } = useWalletConnect()
  const registeredRef = useRef<string | null>(null)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  useEffect(() => {
    if (!isConnected || !address || registeredRef.current === address) {
      return
    }

    registeredRef.current = address

    dispatch(
      addSignerWithEffects({
        value: getAddress(address),
        name: walletInfo?.name ?? null,
        logoUri: walletInfo?.icon ?? null,
        type: 'walletconnect',
        walletName: walletInfo?.name,
        walletIcon: walletInfo?.icon,
      }),
    )
  }, [isConnected, address, walletInfo, dispatch])

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
        connectSigner: openWalletConnect,
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
