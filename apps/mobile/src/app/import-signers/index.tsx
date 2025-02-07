import { SectionTitle } from '@/src/components/Title'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import Seed from '@/assets/images/seed.png'
import Wallet from '@/assets/images/wallet.png'
import Metamask from '@/assets/images/metamask.png'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SafeCard } from '@/src/components/SafeCard'
import { router } from 'expo-router'

const items = [
  {
    name: 'seed',
    title: 'Import seed phrase or a private key',
    description: 'Enter a private key or a 12-24 word seed phrase.',
    icon: <SafeFontIcon name="wallet" size={16} />,
    Image: Seed,
    imageProps: { marginBottom: -31 },
    onPress: () => router.push(`/import-signers/private-key`),
  },
  {
    name: 'connectSigner',
    title: 'Connect signer',
    description: 'Connect any signer via one of your installed wallet apps.',
    icon: <SafeFontIcon name="add-owner" size={16} />,
    Image: Metamask,
    imageProps: { marginBottom: -48 },
  },
  {
    name: 'hardwareSigner',
    title: 'Import hardware signer',
    description: 'Use your Ledger or Keystone device.',
    icon: <SafeFontIcon name="hardware" size={16} />,
    Image: Wallet,
  },
]

const title = 'Import a signer'

function ImportSignersPage() {
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  return (
    <SafeAreaView edges={['bottom']}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle
          title={title}
          description="Select how you'd like to import your signer. Ensure it belongs to this Safe account so you can interact with it seamlessly."
        />

        {items.map((item, index) => (
          <SafeCard
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
    </SafeAreaView>
  )
}

export default ImportSignersPage
