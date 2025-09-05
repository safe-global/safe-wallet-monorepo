import React from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { SectionTitle } from '@/src/components/Title'
import { SafeCard } from '@/src/components/SafeCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'

import LedgerImage from '@/assets/images/wallet.png'

const hardwareDevices = [
  {
    name: 'ledger',
    title: 'Ledger',
    description: 'Connect your Ledger Nano X via Bluetooth.',
    icon: <SafeFontIcon name="hardware" size={16} />,
    Image: LedgerImage,
    onPress: () => router.push('/import-signers/ledger-connect'),
  },
]

const title = 'Hardware devices'

export default function HardwareDevicesPage() {
  const { bottom } = useSafeAreaInsets()
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle paddingRight={5}>{title}</NavBarTitle>,
  })

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <ScrollView onScroll={handleScroll}>
        <SectionTitle title={title} description="Select your hardware device to connect and import addresses." />

        {hardwareDevices.map((device, index) => (
          <SafeCard
            testID={device.name}
            onPress={device.onPress}
            key={`${device.name}-${index}`}
            title={device.title}
            description={device.description}
            icon={device.icon}
            image={device.Image}
          />
        ))}
      </ScrollView>
    </View>
  )
}
