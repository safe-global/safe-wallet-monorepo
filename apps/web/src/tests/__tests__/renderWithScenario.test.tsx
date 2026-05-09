import React from 'react'
import { http, HttpResponse } from 'msw'
import { renderWithScenario } from '@/tests/scenario-utils'
import { safeFixtures, SAFE_ADDRESSES } from '@safe-global/test/msw/fixtures'
import useSafeInfo from '@/hooks/useSafeInfo'

// Minimal component that displays safeAddress from Redux store
function SafeAddressDisplay() {
  const { safeAddress, safeLoaded } = useSafeInfo()
  if (!safeLoaded) return <span>loading</span>
  return <span data-testid="safe-address">{safeAddress}</span>
}

describe('renderWithScenario', () => {
  describe('fixture scenarios — Redux state pre-loaded from fixtures', () => {
    it('efSafe — provides the correct safe address', () => {
      const { getByTestId } = renderWithScenario(<SafeAddressDisplay />, 'efSafe')
      expect(getByTestId('safe-address').textContent).toBe(safeFixtures.efSafe.address.value)
    })

    it('vitalik — provides the correct safe address', () => {
      const { getByTestId } = renderWithScenario(<SafeAddressDisplay />, 'vitalik')
      expect(getByTestId('safe-address').textContent).toBe(safeFixtures.vitalik.address.value)
    })

    it('spamTokens — provides the correct safe address', () => {
      const { getByTestId } = renderWithScenario(<SafeAddressDisplay />, 'spamTokens')
      expect(getByTestId('safe-address').textContent).toBe(safeFixtures.spamTokens.address.value)
    })

    it('empty — falls back to efSafe safe (no empty safe fixture exists)', () => {
      const { getByTestId } = renderWithScenario(<SafeAddressDisplay />, 'empty')
      expect(getByTestId('safe-address').textContent).toBe(safeFixtures.efSafe.address.value)
    })
  })

  describe('SAFE_ADDRESSES fixture metadata', () => {
    it('addresses are on Ethereum mainnet (chainId 1)', () => {
      expect(SAFE_ADDRESSES.efSafe.chainId).toBe('1')
      expect(SAFE_ADDRESSES.vitalik.chainId).toBe('1')
    })

    it('fixture owners have non-empty owners list', () => {
      expect(safeFixtures.efSafe.owners.length).toBeGreaterThan(0)
    })
  })

  describe('extra MSW handlers via options', () => {
    it('registers additional handlers for the test (reset after each test automatically)', () => {
      let intercepted = false
      renderWithScenario(<SafeAddressDisplay />, 'efSafe', {
        handlers: [
          http.get(/\/custom-test-route/, () => {
            intercepted = true
            return HttpResponse.json({ ok: true })
          }),
        ],
      })
      // The handler is registered; intercepted stays false because no fetch was made,
      // but the registration itself should not throw
      expect(intercepted).toBe(false)
    })
  })

  describe('store overrides', () => {
    it('applies storeOverrides on top of the fixture baseline', () => {
      const { getByTestId } = renderWithScenario(<SafeAddressDisplay />, 'efSafe', {
        storeOverrides: {
          safeInfo: {
            data: { ...safeFixtures.vitalik, deployed: true },
            loading: false,
            loaded: true,
          },
        },
      })

      // The store override replaces efSafe's safeInfo with vitalik's data
      expect(getByTestId('safe-address').textContent).toBe(safeFixtures.vitalik.address.value)
    })

    it('defaults to loaded:true so safeAddress is rendered immediately', () => {
      const { getByTestId, queryByText } = renderWithScenario(<SafeAddressDisplay />, 'efSafe')
      expect(queryByText('loading')).not.toBeInTheDocument()
      expect(getByTestId('safe-address')).toBeInTheDocument()
    })
  })
})
