import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { getTokenValue, H5, View } from 'tamagui'
import React, { useCallback, useEffect, useRef } from 'react'
import BottomSheet, {
  BottomSheetFooterProps,
  BottomSheetModalProps,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetFooter,
} from '@gorhom/bottom-sheet'
import DraggableFlatList, { DragEndParams, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LoadingTx } from '@/src/features/ConfirmTx/components/LoadingTx'

interface SafeBottomSheetProps<T> {
  children?: React.ReactNode
  title?: string
  sortable?: boolean
  onDragEnd?: (params: DragEndParams<T>) => void
  items?: T[]
  snapPoints?: BottomSheetModalProps['snapPoints']
  actions?: React.ReactNode
  FooterComponent?: React.FC
  renderItem?: React.FC<{ item: T; isDragging?: boolean; drag?: () => void; onClose: () => void }>
  keyExtractor?: ({ item, index }: { item: T; index: number }) => string
  loading?: boolean
}

export function SafeBottomSheet<T>({
  children,
  title,
  sortable,
  items,
  loading,
  snapPoints = [600, '100%'],
  keyExtractor,
  actions,
  renderItem: Render,
  FooterComponent,
  onDragEnd,
}: SafeBottomSheetProps<T>) {
  const ref = useRef<BottomSheet>(null)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [footerHeight, setFooterHeight] = React.useState(0)
  const hasCustomItems = items?.length && Render
  const isSortable = items?.length && sortable

  const onClose = useCallback(() => {
    router.back()
  }, [])

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<T>) => {
      return (
        <ScaleDecorator activeScale={1.05}>
          {Render && <Render drag={drag} isDragging={isActive} item={item} onClose={onClose} />}
        </ScaleDecorator>
      )
    },
    [Render],
  )

  const TitleHeader = useCallback(
    () => (
      <View justifyContent="center" marginTop="$3" marginBottom="$4" alignItems="center">
        <H5 fontWeight={600}>{title}</H5>

        {actions && (
          <View position="absolute" right={'$4'} top={'$1'}>
            {actions}
          </View>
        )}
      </View>
    ),
    [title, actions],
  )

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      router.back()
    }
  }, [])

  // Auto-expand when sorting is enabled
  useEffect(() => {
    if (sortable && ref.current) {
      ref.current.expand()
    }
  }, [sortable])

  // Wrapping the footer component with a function to get the height of the footer
  const renderFooter: React.FC<BottomSheetFooterProps> = useCallback(
    (props) => {
      return (
        <BottomSheetFooter animatedFooterPosition={props.animatedFooterPosition}>
          <View
            onLayout={(e) => {
              setFooterHeight(e.nativeEvent.layout.height)
            }}
          >
            {FooterComponent && <FooterComponent />}
          </View>
        </BottomSheetFooter>
      )
    },
    [FooterComponent, setFooterHeight],
  )

  return (
    <BottomSheet
      ref={ref}
      enableOverDrag={false}
      snapPoints={snapPoints}
      enableDynamicSizing={true}
      onChange={handleSheetChanges}
      enablePanDownToClose
      overDragResistanceFactor={10}
      backgroundComponent={BackgroundComponent}
      backdropComponent={BackdropComponent}
      footerComponent={isSortable ? undefined : renderFooter}
      topInset={insets.top}
    >
      <BottomSheetView
        style={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {title && <TitleHeader />}
        {isSortable ? (
          <DraggableFlatList<T>
            data={items}
            style={{ marginBottom: insets.bottom }}
            containerStyle={{ height: '100%' }}
            contentContainerStyle={{ paddingBottom: 50 }}
            onDragEnd={onDragEnd}
            keyExtractor={(item, index) => (keyExtractor ? keyExtractor({ item, index }) : index.toString())}
            renderItem={renderItem}
          />
        ) : (
          <BottomSheetScrollView
            style={{
              marginBottom: (!sortable && FooterComponent ? footerHeight : 0) + 12,
            }}
            contentContainerStyle={[styles.scrollInnerContainer]}
          >
            <View minHeight={200} alignItems="center" paddingVertical="$3">
              <View alignItems="flex-start" paddingBottom="$4" width="100%">
                {loading ? (
                  <LoadingTx />
                ) : hasCustomItems ? (
                  items.map((item, index) => (
                    <Render key={keyExtractor ? keyExtractor({ item, index }) : index} item={item} onClose={onClose} />
                  ))
                ) : (
                  children
                )}
              </View>
            </View>
          </BottomSheetScrollView>
        )}
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: 'space-around',
  },
  scrollInnerContainer: {
    paddingHorizontal: getTokenValue('$3'),
  },
})
