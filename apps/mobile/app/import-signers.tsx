import { SectionTitle } from '@/src/components/Title'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import Seed from '@/assets/images/seed.png'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SafeCard } from '@/src/components/SafeCard'

/**
 * TODO: Add the images for each items
 * waiting for the design to exprot - figma is crazy
 */
const items = [
  {
    name: 'seed',
    title: 'Import seed phrase or a private key',
    description: 'Enter a private key or a 12-24 word seed phrase.',
    icon: <SafeFontIcon name="wallet" size={16} />,
    Image: Seed,
  },
  {
    name: 'connectSigner',
    title: 'Connect signer',
    description: 'Connect any signer via one of your installed wallet apps.',
    icon: <SafeFontIcon name="add-owner" size={16} />,
    Image: Seed,
  },
  {
    name: 'hardwareSigner',
    title: 'Import hardware signer',
    description: 'Use your Ledger or Keystone device.',
    icon: <SafeFontIcon name="hardware" size={16} />,
    Image: Seed,
  },
]

function ImportSignersPage() {
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>Import Signers</NavBarTitle>,
  })

  return (
    <SafeAreaView edges={['bottom']}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle
          title="Import Signers"
          description="Select how you'd like to import your signer. Ensure it belongs to this Safe account so you can interact with it seamlessly."
        />

        {items.map((item, index) => (
          <SafeCard
            key={`${item.name}-${index}`}
            title={item.title}
            description={item.description}
            icon={item.icon}
            image={item.Image}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ImportSignersPage
