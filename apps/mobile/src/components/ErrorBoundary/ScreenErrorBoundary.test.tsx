import React from 'react'
import { Text } from 'tamagui'
import { DdRum } from 'expo-datadog'
import { render, fireEvent } from '@/src/tests/test-utils'
import { ScreenErrorBoundary } from './ScreenErrorBoundary'
import Logger from '@/src/utils/logger'

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
  LogLevel: { TRACE: 0, INFO: 1, WARN: 2, ERROR: 3 },
}))

describe('ScreenErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // React logs caught render errors to console.error; silence the expected noise.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ScreenErrorBoundary>
        <Text>content</Text>
      </ScreenErrorBoundary>,
    )

    expect(getByText('content')).toBeTruthy()
  })

  it('renders a fallback and reports to Datadog when a child throws', () => {
    const Boom = () => {
      throw new Error('boom')
    }

    const { getByTestId } = render(
      <ScreenErrorBoundary>
        <Boom />
      </ScreenErrorBoundary>,
    )

    expect(getByTestId('screen-error')).toBeTruthy()
    // Caught errors don't reach the global handler, so the boundary must report to RUM itself.
    expect(DdRum.addError).toHaveBeenCalled()
    expect(Logger.error).toHaveBeenCalled()
  })

  it('shows a dismiss action only when onDismiss is provided and calls it', () => {
    const onDismiss = jest.fn()
    const Boom = () => {
      throw new Error('boom')
    }

    const { getByTestId } = render(
      <ScreenErrorBoundary onDismiss={onDismiss}>
        <Boom />
      </ScreenErrorBoundary>,
    )

    fireEvent.press(getByTestId('screen-error-dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('omits the dismiss action when no onDismiss is provided', () => {
    const Boom = () => {
      throw new Error('boom')
    }

    const { queryByTestId } = render(
      <ScreenErrorBoundary>
        <Boom />
      </ScreenErrorBoundary>,
    )

    expect(queryByTestId('screen-error-dismiss')).toBeNull()
  })

  it('recovers when retry is pressed after the child stops throwing', () => {
    let shouldThrow = true
    const MaybeBoom = () => {
      if (shouldThrow) {
        throw new Error('boom')
      }
      return <Text>recovered</Text>
    }

    const { getByTestId, getByText } = render(
      <ScreenErrorBoundary>
        <MaybeBoom />
      </ScreenErrorBoundary>,
    )

    expect(getByTestId('screen-error')).toBeTruthy()

    shouldThrow = false
    fireEvent.press(getByTestId('screen-error-retry'))

    expect(getByText('recovered')).toBeTruthy()
  })
})
