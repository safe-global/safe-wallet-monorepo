import { View, Text, ScrollView, H2 } from 'tamagui'
import { CopyButton } from '@/src/components/CopyButton'
import { type Info } from '@/src/features/Developer/types'

type DeveloperProps = {
  info: Info
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
export const Developer = ({ info }: DeveloperProps) => {
  return (
    <View flex={1}>
      <ScrollView marginHorizontal={'$4'}>
        <View>
          <H2>App info</H2>
          <Info info={info.application} />
        </View>
        <View marginTop={'$2'}>
          <H2>Device Info</H2>
          <Info info={info.device} />
        </View>
      </ScrollView>
    </View>
  )
}
