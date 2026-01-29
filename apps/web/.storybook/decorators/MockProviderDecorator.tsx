import React, { type ReactNode } from 'react'
import { StoreDecorator } from '@/stories/storeDecorator'
import type { StoryContext } from 'storybook/internal/csf'
import { Paper } from '@mui/material'

type MockProviderDecoratorProps = {
  children: ReactNode
  /** Initial Redux store state */
  initialState?: Record<string, unknown>
  /** Storybook context for theme sync */
  context?: StoryContext
  /** Whether to wrap content in a Paper component */
  withPaper?: boolean
  /** Paper padding */
  paperPadding?: number
}

/**
 * MockProviderDecorator provides Redux store and optional Paper wrapper
 * for stories that need state management.
 *
 * This is a convenience wrapper around StoreDecorator that also handles
 * common UI patterns like Paper wrapping.
 */
export const MockProviderDecorator = ({
  children,
  initialState = {},
  context,
  withPaper = false,
  paperPadding = 2,
}: MockProviderDecoratorProps) => {
  const content = withPaper ? <Paper sx={{ p: paperPadding }}>{children}</Paper> : children

  return (
    <StoreDecorator initialState={initialState} context={context}>
      {content}
    </StoreDecorator>
  )
}

/**
 * Storybook decorator function for wrapping stories with mock providers
 */
export const withMockProvider = (options?: Omit<MockProviderDecoratorProps, 'children' | 'context'>) => {
  const MockProviderWrapper = (Story: React.ComponentType, context: StoryContext) => (
    <MockProviderDecorator {...options} context={context}>
      <Story />
    </MockProviderDecorator>
  )
  MockProviderWrapper.displayName = 'MockProviderWrapper'
  return MockProviderWrapper
}
