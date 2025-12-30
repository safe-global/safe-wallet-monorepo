/**
 * Storybook test setup - applies global decorators from preview.ts
 */
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from '../../.storybook/preview'
import { faker } from '@faker-js/faker'
import * as formatters from '@safe-global/utils/utils/formatters'

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
