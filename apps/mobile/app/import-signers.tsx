import { Badge } from '@/src/components/Badge'
import { Container } from '@/src/components/Container'
import { SectionTitle } from '@/src/components/Title'
import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { H5, Image, Text, View } from 'tamagui'
import Seed from '@/assets/images/seed.png'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SafeAreaView } from 'react-native-safe-area-context'

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
          <Container key={`${item.name}-${index}`} position="relative" marginHorizontal={'$3'} marginTop={'$6'}>
            <Badge circular content={item.icon} themeName="badge_background" />
            <H5 fontWeight={600} marginBottom="$1" marginTop="$4">
              {item.title}
            </H5>
            <Text fontSize={'$4'} color="$colorSecondary">
              {item.description}
            </Text>

            <View alignItems="center">
              <Image
                maxWidth={300}
                width={'100%'}
                borderRadius={'$4'}
                marginBottom="-16"
                marginTop="$4"
                height={100}
                source={item.Image}
              />
            </View>
          </Container>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ImportSignersPage
