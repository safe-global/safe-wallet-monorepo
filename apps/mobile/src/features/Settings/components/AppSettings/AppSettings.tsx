import { ScrollView, Text, Theme, View, YStack } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon as Icon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Pressable } from 'react-native'
import { Skeleton } from 'moti/skeleton'
import { type SettingsSection } from './AppSettings.types'
import { IconName } from '@/src/types/iconTypes'
import { ScreenHeader } from '@/src/components/ScreenHeader'

interface AppSettingsProps {
  sections: SettingsSection[]
}

export const AppSettings = ({ sections }: AppSettingsProps) => {
  return (
    <Theme name={'settings'}>
      <ScreenHeader paddingHorizontal={'$4'} sectionTitle="Settings" />
      <ScrollView
        style={{
          paddingTop: 0,
        }}
        contentContainerStyle={{
          marginTop: 10,
        }}
      >
        <YStack flex={1} paddingHorizontal="$3">
          <Skeleton.Group show={false}>
            <YStack space="$4">
              {sections.map((section, sectionIndex) => (
                <View
                  key={`section-${sectionIndex}`}
                  backgroundColor="$backgroundDark"
                  padding="$1"
                  borderRadius="$3"
                  gap={'$2'}
                >
                  {section.sectionName && <Text color="$colorSecondary">{section.sectionName}</Text>}
                  <View backgroundColor={'$background'} borderRadius={'$3'}>
                    {section.items.map((item, itemIndex) => (
                      <Pressable
                        key={`item-${sectionIndex}-${itemIndex}`}
                        style={({ pressed }) => [{ opacity: pressed || item.disabled ? 0.5 : 1.0 }]}
                        onPress={item.onPress}
                        disabled={item.disabled}
                      >
                        <SafeListItem
                          label={item.label}
                          leftNode={<Icon name={item.leftIcon as IconName} color={'$colorSecondary'} />}
                          rightNode={item.rightNode ?? <Icon name={'chevron-right'} />}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </YStack>
          </Skeleton.Group>
        </YStack>
      </ScrollView>
    </Theme>
  )
}
