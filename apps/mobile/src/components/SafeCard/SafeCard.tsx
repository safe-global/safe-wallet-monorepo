import { H5, Image, ImageProps, Text, View, XStack } from 'tamagui'
import { Badge } from '../Badge'
import { Container } from '../Container'
import { ImageSourcePropType } from 'react-native'
import { isValidElement, ReactElement } from 'react'

interface SafeCardProps {
  title: string
  description: string
  image?: ImageSourcePropType | ReactElement
  icon?: ReactElement
  tag?: ReactElement
  children?: React.ReactNode
  onPress?: () => void
  imageProps?: ImageProps
  testID?: string
}

const baseImageProps = {
  maxWidth: 300,
  width: '100%',
  height: 100,
  testID: 'safe-card-image',
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
          {isValidElement(image) ? (
            <View {...imageProps} {...baseImageProps}>
              {image}
            </View>
          ) : (
            <Image
              {...imageProps}
              {...baseImageProps}
              objectFit="contain"
              marginTop="$4"
              // @ts-expect-error Tamagui v2 types src as string but require() returns number - works at runtime
              src={image}
            />
          )}
        </View>
      )}
    </Container>
  )
}
