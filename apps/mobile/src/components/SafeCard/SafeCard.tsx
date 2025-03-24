import { H5, Image, ImageProps, Text, View, XStack } from 'tamagui'
import { Badge } from '../Badge'
import { Container } from '../Container'
import { ImageSourcePropType } from 'react-native'
import { ReactElement } from 'react'

interface SafeCardProps {
  title: string
  description: string
  image?: ImageSourcePropType
  icon?: ReactElement
  tag?: ReactElement
  children?: React.ReactNode
  onPress?: () => void
  imageProps?: ImageProps
  testID?: string
}

export function SafeCard({
  title,
  description,
  imageProps,
  image,
  icon,
  children,
  onPress,
  testID,
  tag,
}: SafeCardProps) {
  return (
    <Container position="relative" marginHorizontal={'$3'} marginTop={'$6'} onPress={onPress} testID={testID}>
      <XStack justifyContent={'space-between'}>
        {icon && <Badge circular content={icon} themeName="badge_background" />}
        {tag}
      </XStack>

      <H5 fontWeight={600} marginBottom="$1" marginTop="$4">
        {title}
      </H5>

      <Text fontSize={'$4'} color="$colorSecondary">
        {description}
      </Text>

      {children}

      {image && (
        <View alignItems="center">
          <Image
            {...imageProps}
            testID="safe-card-image"
            resizeMode="contain"
            maxWidth={300}
            width={'100%'}
            borderRadius={'$4'}
            marginTop="$4"
            height={100}
            source={image}
          />
        </View>
      )}
    </Container>
  )
}
