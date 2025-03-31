import { ScrollView, Text, Theme, View, YStack } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { SafeFontIcon as Icon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { Pressable } from 'react-native'
import { type SettingsSection } from './AppSettings.types'
import { IconName } from '@/src/types/iconTypes'
import { LargeHeaderTitle } from '@/src/components/Title'

interface AppSettingsProps {
  sections: SettingsSection[]
}

export const AppSettings = ({ sections }: AppSettingsProps) => {
  return (
    <Theme name={'settings'}>
      <LargeHeaderTitle marginLeft={16} marginTop={8}>
        Settings
      </LargeHeaderTitle>
      <ScrollView
        style={{
          paddingTop: 0,
        }}
        contentContainerStyle={{
          marginTop: 10,
        }}
      >
        <YStack flex={1} paddingHorizontal="$3">
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
                  {section.items.map((item, itemIndex) => {
                    if (item.type === 'floating-menu') {
                      return (
                        <SafeListItem
                          key={`item-${sectionIndex}-${itemIndex}`}
                          label={item.label}
                          leftNode={<Icon name={item.leftIcon as IconName} color={'$colorSecondary'} />}
                          rightNode={item.rightNode ?? <Icon name={'chevron-right'} />}
                        />
                      )
                    }

                    return (
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
                    )
                  })}
                </View>
              </View>
            ))}
          </YStack>
        </YStack>
      </ScrollView>
    </Theme>
  )
}
