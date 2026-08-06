/**
 * Storybook test setup - applies global decorators from preview.ts
 */
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from '../../.storybook/preview'
import { faker } from '@faker-js/faker'
import * as formatters from '@safe-global/utils/utils/formatters'
import * as chainHooks from '@/hooks/useChains'
import { chainFixtures } from '@safe-global/test/msw/fixtures'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

jest.mock(
  'msw-storybook-addon',
  () => ({
    initialize: jest.fn(),
    mswLoader: jest.fn(),
  }),
  { virtual: true },
)

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

// Real staging chain configs (schema-validated fixtures): mainnet, Hoodi, Polygon, Sepolia
const STORY_CHAINS: Chain[] = chainFixtures.all.results

jest.spyOn(chainHooks, 'default').mockImplementation(() => ({
  configs: STORY_CHAINS,
  loading: false,
}))

jest.spyOn(chainHooks, 'useChain').mockImplementation((chainId: string) => {
  return STORY_CHAINS.find((chain) => chain.chainId === chainId)
})

jest.spyOn(chainHooks, 'useCurrentChain').mockImplementation(() => {
  return STORY_CHAINS[0]
})

// Apply the global decorators (ThemeProvider, etc.) to all composed stories
setProjectAnnotations(previewAnnotations)
