import React, { useMemo } from 'react'
import { ScrollView } from 'react-native'
import Seed from '@/assets/images/seed.png'
import Wallet from '@/assets/images/wallet.png'
import Metamask from '@/assets/images/metamask.png'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle, SectionTitle } from '@/src/components/Title'
import { SafeCard } from '@/src/components/SafeCard'
import { router } from 'expo-router'
import { Tag } from '@/src/components/Tag'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { View } from 'tamagui'

const items = [
  {
    name: 'seed',
    title: 'Import signer',
    description: 'Enter a private key or seed phrase.',
    icon: <SafeFontIcon name="wallet" size={16} />,
    Image: Seed,
    imageProps: { marginBottom: -31 },
    onPress: () => router.push(`/import-signers/signer`),
  },
  {
    name: 'hardwareSigner',
    title: 'Import hardware signer',
    description: 'Use your Ledger device.',
    icon: <SafeFontIcon name="hardware" size={16} />,
    Image: Wallet,
    onPress: () => router.push('/import-signers/hardware-devices'),
  },
  {
    name: 'connectSigner',
    title: 'Connect signer',
    description: 'Connect any signer via one of your installed wallet apps.',
    icon: <SafeFontIcon name="add-owner" size={16} />,
    tag: <Tag>Coming soon</Tag>,
    Image: Metamask,
    imageProps: { marginBottom: -48 },
  },
]

const title = 'Import a signer'

export const ImportSignersContainer = () => {
  const { isBiometricsEnabled } = useBiometrics()
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  const memoizedItems = useMemo(() => {
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
  }, [isBiometricsEnabled])

  return (
    <View flex={1}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle
          title={title}
          description="Select how you'd like to import your signer. Ensure it belongs to this Safe account so you can interact with it seamlessly."
        />

        {memoizedItems.map((item, index) => (
          <SafeCard
            testID={item.name}
            onPress={item.onPress}
            key={`${item.name}-${index}`}
            title={item.title}
            description={item.description}
            tag={item.tag}
            icon={item.icon}
            image={item.Image}
            imageProps={item.imageProps}
          />
        ))}
      </ScrollView>
    </View>
  )
}
