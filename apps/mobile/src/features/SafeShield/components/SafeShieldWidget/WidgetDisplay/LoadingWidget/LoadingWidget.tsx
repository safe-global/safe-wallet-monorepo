import React from 'react'
import { SafeSkeleton } from '@/src/components/SafeSkeleton'
import { WidgetDisplayWrapper } from '../WidgetDisplayWrapper'

export function LoadingWidget() {
  return (
    <WidgetDisplayWrapper>
      <SafeSkeleton.Group show={true}>
        <SafeSkeleton height={20} radius={4} width={'100%'} />
        <SafeSkeleton height={20} radius={4} width={'100%'} />
        <SafeSkeleton height={20} radius={4} width={'100%'} />
        <SafeSkeleton height={60} width={'100%'} />
      </SafeSkeleton.Group>
    </WidgetDisplayWrapper>
  )
}
