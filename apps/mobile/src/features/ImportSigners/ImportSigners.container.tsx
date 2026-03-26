import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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
import { View } from 'tamagui'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { addSignerWithEffects } from '@/src/store/signerThunks'
import { selectSignerByAddress, SignerType } from '@/src/store/signersSlice'
import { getAddress } from 'ethers'

const title = 'Add signer'

export const ImportSignersContainer = () => {
  const { isBiometricsEnabled } = useBiometrics()
  const dispatch = useAppDispatch()
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const existingSigner = useAppSelector((state) => (address ? selectSignerByAddress(state, address) : undefined))
  const registeredRef = useRef<string | null>(null)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  useEffect(() => {
    if (!isConnected || !address || existingSigner || registeredRef.current === address) {
      return
    }

    registeredRef.current = address

    dispatch(
      addSignerWithEffects({
        value: getAddress(address),
        name: walletInfo?.name ?? null,
        logoUri: walletInfo?.icon ?? null,
        type: SignerType.WALLETCONNECT,
        walletName: walletInfo?.name,
        walletIcon: walletInfo?.icon,
      }),
    )
  }, [isConnected, address, existingSigner, walletInfo, dispatch])

  const handleConnectSigner = useCallback(() => {
    open({ view: 'Connect' })
  }, [open])

  const memoizedItems = useMemo(() => {
    const items = [
      {
        name: 'seed',
        title: 'Import using private key',
        description: 'Store a private key on this device to sign transactions.',
        icon: <SafeFontIcon name="keyboard" size={16} />,
        Image: Seed,
        imageProps: { marginBottom: -31 },
        onPress: () => router.push('/import-signers/signer'),
      },
      {
        name: 'hardwareSigner',
        title: 'Connect hardware device',
        description: 'Connect hardware device to sign transactions.',
        icon: <SafeFontIcon name="hardware" size={16} />,
        Image: Wallet,
        imageProps: { marginBottom: -32 },
        onPress: () => router.push('/import-signers/hardware-devices'),
      },
      {
        name: 'connectSigner',
        title: 'Connect wallet app',
        description: 'Connect an external wallet app to sign transactions.',
        icon: <SafeFontIcon name="dapp-logo" size={16} />,
        Image: ConnectWalletApp,
        imageProps: { marginBottom: -32 },
        onPress: handleConnectSigner,
      },
    ]

    return items.map((item) => {
      const newItem = { ...item }

      if (!isBiometricsEnabled && item.name === 'seed') {
        newItem.onPress = () =>
          router.push({
            pathname: '/biometrics-opt-in',
            params: {
              caller: '/import-signers',
            },
          })
      }

      return newItem
    })
  }, [isBiometricsEnabled, handleConnectSigner])

  return (
    <View flex={1}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle title={title} description="Select how you'd like to add your signer." />

        {memoizedItems.map((item, index) => (
          <SafeCard
            testID={item.name}
            onPress={item.onPress}
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
