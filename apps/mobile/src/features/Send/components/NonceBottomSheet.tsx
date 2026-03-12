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

function RecommendedNonceRow({
  nonce,
  isSelected,
  onPress,
}: {
  nonce: number
  isSelected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} testID="nonce-recommended">
      <View
        flexDirection="row"
        alignItems="center"
        paddingVertical="$1"
        paddingHorizontal="$3"
        borderRadius={8}
        backgroundColor={isSelected ? '$borderLight' : undefined}
        gap="$1"
      >
        <Text fontSize="$4" fontWeight={600} color="$color" width={40} textAlign="right">
          {nonce}
        </Text>
        <Text fontSize="$4" color="$colorSecondary">
          New transaction
        </Text>
      </View>
    </Pressable>
  )
}

function ReplaceExistingDivider() {
  return (
    <View flexDirection="row" alignItems="center" gap="$3" paddingHorizontal="$2" paddingVertical="$2">
      <View flex={1} height={1} backgroundColor="$borderLight" />
      <Text fontSize="$4" color="$colorSecondary">
        Replace existing
      </Text>
      <View flex={1} height={1} backgroundColor="$borderLight" />
    </View>
  )
}

function QueuedNonceRow({
  item,
  isSelected,
  onPress,
}: {
  item: QueuedNonceItem
  isSelected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} testID={`nonce-queued-${item.nonce}`}>
      <View
        flexDirection="row"
        alignItems="center"
        paddingVertical="$3"
        paddingHorizontal="$3"
        borderRadius={8}
        backgroundColor={isSelected ? '$borderLight' : undefined}
        gap="$1"
      >
        <Text fontSize="$4" fontWeight={600} color="$color" width={40} textAlign="right" fontVariant={['tabular-nums']}>
          {item.nonce}
        </Text>
        <Text fontSize="$4" color="$colorSecondary">
          {item.label}
        </Text>
      </View>
    </Pressable>
  )
}

function useRenderFooter(insets: { bottom: number }, onAddCustomNonce: () => void, onLayout: (height: number) => void) {
  return useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter animatedFooterPosition={props.animatedFooterPosition} bottomInset={insets.bottom}>
        <View
          onLayout={(e) => onLayout(e.nativeEvent.layout.height)}
          backgroundColor="$backgroundSheet"
          paddingTop="$2"
          paddingBottom={insets.bottom + 8}
          marginBottom={-insets.bottom}
        >
          <View height={1} backgroundColor="$borderLight" marginBottom="$2" />
          <Pressable onPress={onAddCustomNonce} testID="nonce-add-custom">
            <View
              flexDirection="row"
              alignItems="center"
              marginHorizontal="$4"
              paddingVertical="$1"
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
    [insets.bottom, onAddCustomNonce, onLayout],
  )
}

export const NonceBottomSheet = forwardRef<BottomSheetModal, NonceBottomSheetProps>(function NonceBottomSheet(
  { recommendedNonce, queuedNonces, selectedNonce, onSelectNonce, onAddCustomNonce, onEndReached, isFetchingMore },
  ref,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const [footerHeight, setFooterHeight] = useState(0)

  const renderBackdrop = useCallback(() => <BackdropComponent shouldNavigateBack={false} />, [])

  const renderFooter = useRenderFooter(insets, onAddCustomNonce, setFooterHeight)

  const handleSelectRecommended = useCallback(() => {
    if (recommendedNonce !== undefined) {
      onSelectNonce(recommendedNonce)
    }
  }, [recommendedNonce, onSelectNonce])

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

        <View paddingHorizontal="$4">
          {recommendedNonce !== undefined && (
            <RecommendedNonceRow
              nonce={recommendedNonce}
              isSelected={isRecommendedSelected}
              onPress={handleSelectRecommended}
            />
          )}

          {queuedNonces.length > 0 && <ReplaceExistingDivider />}

          {queuedNonces.map((item) => (
            <QueuedNonceRow
              key={item.nonce}
              item={item}
              isSelected={selectedNonce === item.nonce}
              onPress={() => onSelectNonce(item.nonce)}
            />
          ))}

          {isFetchingMore && (
            <View paddingVertical="$2" alignItems="center" justifyContent="center">
              <Loader size={24} color="$color" />
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})
