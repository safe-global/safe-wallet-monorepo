import { View, Text, ScrollView, H2 } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { LoadableSwitch } from '@/src/components/LoadableSwitch'
import { type Info } from '@/src/features/Developer/types'
import { getCrashlytics } from '@react-native-firebase/crashlytics'
import { SafeButton } from '@/src/components/SafeButton'

type DeveloperProps = {
  info: Info
  screenProtectionDisabled: boolean
  onToggleScreenProtection: () => void
}

type InfoProps = {
  info: Record<string, string>
}
const Info = ({ info }: InfoProps) => {
  return (
    <View>
      {Object.keys(info).map((key) => {
        const value = info[key]
        return (
          <View key={key} marginBottom={'$2'}>
            <Text fontWeight={600}>{key}: </Text>
            <View padding={'$2'} borderRadius={'$6'} flex={1} flexDirection={'row'} justifyContent={'space-between'}>
              <Text flex={1}>{value}</Text>
              <View>
                <CopyButton value={value} color={'$primary'} />
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}
export const Developer = ({ info, screenProtectionDisabled, onToggleScreenProtection }: DeveloperProps) => {
  return (
    <View flex={1}>
      <ScrollView paddingHorizontal={'$4'}>
        <View>
          <H2>App info</H2>
          <Info info={info.application} />
        </View>
        <View marginTop={'$2'}>
          <H2>Device Info</H2>
          <Info info={info.device} />
        </View>
        <View marginTop={'$4'}>
          <View flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
            <View flex={1} marginRight={'$2'}>
              <Text fontWeight={600}>Disable screen recording protection</Text>
              <Text fontSize={'$3'} color={'$textSecondary'}>
                Allows screen recording and screenshots on sensitive screens. For testing only.
              </Text>
            </View>
            <LoadableSwitch
              testID="toggle-screen-protection"
              value={screenProtectionDisabled}
              onChange={onToggleScreenProtection}
            />
          </View>
        </View>
        <View marginTop={'$4'}>
          <Text>The button below will crash the app on purpose. This is for testing purposes only.</Text>
          <SafeButton onPress={() => getCrashlytics().crash()}>Crash App</SafeButton>
        </View>
      </ScrollView>
    </View>
  )
}
