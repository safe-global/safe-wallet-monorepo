/**
 * Storybook test setup - applies global decorators from preview.ts
 */
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from '../../.storybook/preview'
import { faker } from '@faker-js/faker'
import * as formatters from '@safe-global/utils/utils/formatters'

// Mock next/router for storybook snapshot tests where NextRouter is not mounted
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
    isReady: true,
  })),
}))

// Seed faker for deterministic test data
faker.seed(123)

// Mock formatPercentage to use en-US locale for consistent snapshots
// Production code remains locale-aware
jest.spyOn(formatters, 'formatPercentage').mockImplementation((value: number, hideFractions?: boolean) => {
  const fraction = hideFractions ? 0 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: fraction,
    signDisplay: 'never',
    minimumFractionDigits: fraction,
  }).format(value)
})

// Apply the global decorators (ThemeProvider, etc.) to all composed stories
setProjectAnnotations(previewAnnotations)
