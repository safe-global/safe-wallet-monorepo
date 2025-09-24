import React from 'react'
import { TouchableOpacity } from 'react-native'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { Loader } from '@/src/components/Loader'

interface LoadMoreButtonProps {
  onPress: () => void
  isLoading: boolean
}

export const LoadMoreButton = ({ onPress, isLoading }: LoadMoreButtonProps) => {
  const { isDark } = useTheme()

  return (
    <View marginTop="$3" marginBottom="$6">
      <TouchableOpacity onPress={onPress} disabled={isLoading} testID="load-more-button">
        <View
          backgroundColor={isDark ? '$backgroundPaper' : '$background'}
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderLight"
          borderStyle="dashed"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="center"
        >
          {isLoading ? (
            <View flexDirection="row" alignItems="center" gap="$2">
              <Loader size={16} thickness={2} />
              <Text fontSize="$4" color="$colorSecondary">
                Loading more addresses...
              </Text>
            </View>
          ) : (
            <View flexDirection="row" alignItems="center" gap="$2">
              <SafeFontIcon name="plus" size={16} color="$primary" />
              <Text fontSize="$4" color="$primary" fontWeight="500">
                Load More
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
}
