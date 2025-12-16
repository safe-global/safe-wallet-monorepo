import { Skeleton } from 'moti/skeleton'
import React from 'react'
import { WidgetDisplayWrapper } from '../WidgetDisplayWrapper'
import { useTheme } from '@/src/theme/hooks/useTheme'
export function LoadingWidget() {
  const { colorScheme } = useTheme()
  return (
    <WidgetDisplayWrapper>
      <Skeleton.Group show={true}>
        <Skeleton colorMode={colorScheme} height={20} radius={4} width={'100%'} />
        <Skeleton colorMode={colorScheme} height={20} radius={4} width={'100%'} />
        <Skeleton colorMode={colorScheme} height={20} radius={4} width={'100%'} />
        <Skeleton colorMode={colorScheme} height={60} width={'100%'} />
      </Skeleton.Group>
    </WidgetDisplayWrapper>
  )
}
