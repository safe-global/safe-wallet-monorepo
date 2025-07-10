import React from 'react'
import { Text, YStack, H2, ScrollView, View } from 'tamagui'
import { Bar } from 'react-native-progress'

interface ImportProgressScreenViewProps {
  progress: number
}

export const ImportProgressScreenView = ({ progress }: ImportProgressScreenViewProps) => {
  return (
    <ScrollView contentContainerStyle={{ flex: 1 }}>
      <YStack flex={1} testID="import-progress-screen">
        {/* Content */}
        <YStack flex={1} paddingHorizontal="$4" justifyContent="center" alignItems="center">
          <YStack gap="$6" alignItems="center" maxWidth={300}>
            {/* Title */}
            <H2 fontWeight={'600'} textAlign="center">
              Your file is being securely imported
            </H2>

            {/* Subtitle */}
            <Text fontSize="$4" textAlign="center" color="$colorSecondary">
              Hang on, it may take a few seconds
            </Text>

            {/* Progress Bar Container */}
            <View width="100%" height={8} borderRadius="$2" overflow="hidden" marginTop="$8">
              <Bar progress={progress / 100} borderWidth={0} color="#5FDDFF" useNativeDriver={true} />
            </View>

            {/* Progress Percentage */}
            <Text fontSize="$5" fontWeight="600" color="$color">
              {Math.round(progress)}%
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
