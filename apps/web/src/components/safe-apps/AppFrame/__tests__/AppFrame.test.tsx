import { render, screen } from '@/tests/test-utils'
import AppFrame from '@/components/safe-apps/AppFrame'
import { getEmptySafeApp } from '@/components/safe-apps/utils'

const emptySafeApp = getEmptySafeApp()

describe('AppFrame', () => {
  it('should not show the transaction queue bar when there are no queued transactions', () => {
    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />)

    expect(screen.queryAllByText('(0) Transaction queue').length).toBe(0)
  })

  // TODO: This test is disabled because txQueue was removed from Redux and migrated to RTK Query
  // This test needs to be refactored to mock the RTK Query hook instead
  it.skip('should show queued transactions in the queue bar', () => {})
})
