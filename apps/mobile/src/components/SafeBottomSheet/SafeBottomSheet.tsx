import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { H5, ScrollView, View } from 'tamagui'
import React, { useCallback } from 'react'
import BottomSheet, { BottomSheetFooterProps, BottomSheetModalProps, BottomSheetView } from '@gorhom/bottom-sheet'
import DraggableFlatList, { DragEndParams, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

interface SafeBottomSheetProps<T> {
  children?: React.ReactNode
  title?: string
  sortable?: boolean
  onDragEnd?: (params: DragEndParams<T>) => void
  items?: T[]
  snapPoints?: BottomSheetModalProps['snapPoints']
  actions?: React.ReactNode
  footerComponent?: React.FC<BottomSheetFooterProps>
  renderItem?: React.FC<{ item: T; isDragging?: boolean; drag?: () => void; onClose: () => void }>
  keyExtractor?: ({ item, index }: { item: T; index: number }) => string
}

export function SafeBottomSheet<T>({
  children,
  title,
  sortable,
  items,
  snapPoints = [600, '90%'],
  keyExtractor,
  actions,
  renderItem: Render,
  footerComponent,
  onDragEnd,
}: SafeBottomSheetProps<T>) {
  const router = useRouter()
  const hasCustomItems = items && Render
  const isSortable = items && sortable

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

  return (
    <BottomSheet
      enableOverDrag={false}
      snapPoints={snapPoints}
      enableDynamicSizing={true}
      onChange={handleSheetChanges}
      enablePanDownToClose
      overDragResistanceFactor={10}
      backgroundComponent={BackgroundComponent}
      backdropComponent={BackdropComponent}
      footerComponent={footerComponent}
    >
      {!isSortable && !!title && <TitleHeader />}
      <BottomSheetView style={[styles.contentContainer, !isSortable ? { flex: 1, paddingHorizontal: 20 } : undefined]}>
        {isSortable ? (
          <DraggableFlatList<T>
            data={items}
            containerStyle={{ height: '100%' }}
            ListHeaderComponent={title ? <TitleHeader /> : undefined}
            onDragEnd={onDragEnd}
            keyExtractor={(item, index) => (keyExtractor ? keyExtractor({ item, index }) : index.toString())}
            renderItem={renderItem}
          />
        ) : (
          <ScrollView>
            <View minHeight={200} alignItems="center" paddingVertical="$3">
              <View alignItems="flex-start" paddingBottom="$4" width="100%">
                {hasCustomItems
                  ? items.map((item, index) => (
                      <Render
                        key={keyExtractor ? keyExtractor({ item, index }) : index}
                        item={item}
                        onClose={onClose}
                      />
                    ))
                  : children}
              </View>
            </View>
          </ScrollView>
        )}
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: 'space-around',
  },
})
