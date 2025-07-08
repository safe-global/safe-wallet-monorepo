import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { faker } from '@faker-js/faker'
import { Alert2, type AlertType } from './Alert2'
import { TamaguiProvider } from 'tamagui'
import config from '@/src/theme/tamagui.config'

// Helper to wrap component with required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TamaguiProvider config={config}>{ui}</TamaguiProvider>)
}

describe('Alert2', () => {
  const defaultProps = {
    type: 'warning' as AlertType,
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    testID: 'test-alert',
  }

  it('renders with required props', () => {
    renderWithProviders(<Alert2 {...defaultProps} />)

    expect(screen.getByText(defaultProps.title)).toBeOnTheScreen()
    expect(screen.getByText(defaultProps.message)).toBeOnTheScreen()
    expect(screen.getByTestId('test-alert')).toBeOnTheScreen()
  })

  it('renders correct icon for each alert type', () => {
    const types: AlertType[] = ['error', 'warning', 'info', 'success']

    types.forEach((type) => {
      const { unmount } = renderWithProviders(<Alert2 {...defaultProps} type={type} testID={`${type}-alert`} />)

      // Check that the correct icon testID is present
      expect(screen.getByTestId(`${type}-icon`)).toBeOnTheScreen()

      unmount()
    })
  })

  it('renders custom icon when iconName is provided', () => {
    const customIconName = 'settings'

    renderWithProviders(<Alert2 {...defaultProps} iconName={customIconName} />)

    expect(screen.getByTestId(`${customIconName}-icon`)).toBeOnTheScreen()
  })

  it('displays title correctly', () => {
    const title = faker.lorem.words(2)

    renderWithProviders(<Alert2 {...defaultProps} title={title} />)

    const titleElement = screen.getByText(title)
    expect(titleElement).toBeOnTheScreen()
  })

  it('displays message correctly', () => {
    const message = faker.lorem.sentence()

    renderWithProviders(<Alert2 {...defaultProps} message={message} />)

    const messageElement = screen.getByText(message)
    expect(messageElement).toBeOnTheScreen()
  })

  it('renders with custom testID', () => {
    const customTestID = faker.string.alphanumeric(10)

    renderWithProviders(<Alert2 {...defaultProps} testID={customTestID} />)

    expect(screen.getByTestId(customTestID)).toBeOnTheScreen()
  })

  it('renders alert start icon container', () => {
    renderWithProviders(<Alert2 {...defaultProps} />)

    expect(screen.getByTestId('alert-start-icon')).toBeOnTheScreen()
  })

  it('handles long title and message content', () => {
    const longTitle = faker.lorem.words(10)
    const longMessage = faker.lorem.sentences(5)

    renderWithProviders(<Alert2 {...defaultProps} title={longTitle} message={longMessage} />)

    expect(screen.getByText(longTitle)).toBeOnTheScreen()
    expect(screen.getByText(longMessage)).toBeOnTheScreen()
  })

  it('renders different alert types with correct themes', () => {
    const types: AlertType[] = ['error', 'warning', 'info', 'success']

    types.forEach((type) => {
      const { unmount } = renderWithProviders(<Alert2 {...defaultProps} type={type} testID={`${type}-alert`} />)

      const alertContainer = screen.getByTestId(`${type}-alert`)
      expect(alertContainer).toBeOnTheScreen()

      unmount()
    })
  })

  it('renders without testID when not provided', () => {
    const propsWithoutTestID = {
      type: 'info' as AlertType,
      title: faker.lorem.words(3),
      message: faker.lorem.sentence(),
    }

    renderWithProviders(<Alert2 {...propsWithoutTestID} />)

    expect(screen.getByText(propsWithoutTestID.title)).toBeOnTheScreen()
    expect(screen.getByText(propsWithoutTestID.message)).toBeOnTheScreen()
  })
})
