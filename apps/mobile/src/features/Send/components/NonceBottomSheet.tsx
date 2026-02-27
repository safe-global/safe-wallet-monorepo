import React, { forwardRef, useCallback, useState } from 'react'
import { Pressable, Platform, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { BottomSheetFooter, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet'
import { Loader } from '@/src/components/Loader'
import { getVariable, H5, Text, View, useTheme } from 'tamagui'
import { FullWindowOverlay } from 'react-native-screens'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface QueuedNonceItem {
  nonce: number
  label: string
}

interface NonceBottomSheetProps {
  recommendedNonce: number | undefined
  queuedNonces: QueuedNonceItem[]
  selectedNonce: number | undefined
  onSelectNonce: (nonce: number) => void
  onAddCustomNonce: () => void
  onEndReached?: () => void
  isFetchingMore?: boolean
}

export const NonceBottomSheet = forwardRef<BottomSheetModal, NonceBottomSheetProps>(function NonceBottomSheet(
  { recommendedNonce, queuedNonces, selectedNonce, onSelectNonce, onAddCustomNonce, onEndReached, isFetchingMore },
  ref,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [footerHeight, setFooterHeight] = useState(0)

  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter animatedFooterPosition={props.animatedFooterPosition}>
        <View
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
          backgroundColor="$backgroundSheet"
          paddingHorizontal="$4"
          paddingTop="$2"
          paddingBottom={insets.bottom + 16}
          marginBottom={-insets.bottom}
        >
          <View height={1} backgroundColor="$borderLight" marginBottom="$2" />
          <Pressable onPress={onAddCustomNonce} testID="nonce-add-custom">
            <View
              flexDirection="row"
              alignItems="center"
              height={64}
              paddingHorizontal="$3"
              borderRadius={8}
              gap="$3"
            >
              <View
                width={40}
                height={40}
                borderRadius={200}
                backgroundColor="$backgroundSkeleton"
                alignItems="center"
                justifyContent="center"
              >
                <SafeFontIcon name="plus" size={16} color="$color" />
              </View>
              <Text fontSize="$4" fontWeight={600} color="$color">
                Add new nonce
              </Text>
            </View>
          </Pressable>
        </View>
      </BottomSheetFooter>
    ),
    [insets.bottom, onAddCustomNonce],
  )

  const handleSelectRecommended = useCallback(() => {
    if (recommendedNonce !== undefined) {
      onSelectNonce(recommendedNonce)
    }
  }, [recommendedNonce, onSelectNonce])

  const handleSelectQueued = useCallback(
    (nonce: number) => {
      onSelectNonce(nonce)
    },
    [onSelectNonce],
  )

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
      const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y

      if (distanceFromEnd < layoutMeasurement.height * 0.2) {
        onEndReached?.()
      }
    },
    [onEndReached],
  )

  const isRecommendedSelected = selectedNonce === recommendedNonce || selectedNonce === undefined

  return (
    <BottomSheetModal
      // @ts-expect-error - FullWindowOverlay is not typed
      containerComponent={Platform.OS === 'ios' ? FullWindowOverlay : undefined}
      ref={ref}
      backgroundComponent={BackgroundComponent}
      backdropComponent={renderBackdrop}
      topInset={insets.top}
      enableDynamicSizing
      handleIndicatorStyle={{
        backgroundColor: getVariable(theme.borderMain),
      }}
      accessible={false}
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: footerHeight + 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        <View paddingTop="$3" paddingBottom="$4" alignItems="center">
          <H5 fontWeight={700}>Recommended nonce</H5>
        </View>

        <View paddingHorizontal="$4" gap="$4">
          {/* Recommended nonce */}
          {recommendedNonce !== undefined && (
            <Pressable onPress={handleSelectRecommended} testID="nonce-recommended">
              <View
                flexDirection="row"
                alignItems="center"
                height={64}
                paddingHorizontal="$3"
                borderRadius={8}
                backgroundColor={isRecommendedSelected ? '$backgroundLightgray' : '$backgroundPaper'}
              >
                <Text fontSize="$4" fontWeight={600} color="$color" width={40}>
                  {recommendedNonce}
                </Text>
                <View flex={1}>
                  <Text fontSize="$4" fontWeight={600} color="$color">
                    New transaction
                  </Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* Replace existing divider */}
          {queuedNonces.length > 0 && (
            <View flexDirection="row" alignItems="center" gap="$3" paddingHorizontal="$2" paddingVertical="$2">
              <View flex={1} height={1} backgroundColor="$borderLight" />
              <Text fontSize="$4" color="$colorSecondary">
                Replace existing
              </Text>
              <View flex={1} height={1} backgroundColor="$borderLight" />
            </View>
          )}

          {/* Queued nonces */}
          {queuedNonces.map((item) => (
            <Pressable
              key={item.nonce}
              onPress={() => handleSelectQueued(item.nonce)}
              testID={`nonce-queued-${item.nonce}`}
            >
              <View
                flexDirection="row"
                alignItems="center"
                height={64}
                paddingHorizontal="$3"
                borderRadius={8}
                backgroundColor={selectedNonce === item.nonce ? '$backgroundLightgray' : undefined}
              >
                <Text fontSize="$4" fontWeight={600} color="$color" width={40}>
                  {item.nonce}
                </Text>
                <View flex={1}>
                  <Text fontSize="$4" fontWeight={600} color="$color">
                    {item.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}

          {isFetchingMore && (
            <View height={64} alignItems="center" justifyContent="center">
              <Loader size={24} color="$color" />
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})
