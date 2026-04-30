import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { NetworksSheetFooter } from '../NetworksSheetFooter'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const baseProps = {
  errorMessage: null,
  isPressable: true,
  onScan: jest.fn(),
  chains: [{ chainId: '1', chainName: 'Ethereum' } as Chain, { chainId: '137', chainName: 'Polygon' } as Chain],
}

describe('NetworksSheetFooter', () => {
  beforeEach(() => {
    baseProps.onScan = jest.fn()
  })

  it('renders the idle label and triggers onScan when tapped', () => {
    render(<NetworksSheetFooter {...baseProps} phase="idle" lastResult={null} />)

    expect(screen.getByText('Scan for new networks')).toBeTruthy()
    expect(screen.queryByTestId('scan-result-text')).toBeNull()

    fireEvent.press(screen.getByTestId('scan-for-new-networks'))
    expect(baseProps.onScan).toHaveBeenCalledTimes(1)
  })

  it('renders a scanning label and is disabled while scanning', () => {
    render(<NetworksSheetFooter {...baseProps} phase="scanning" lastResult={null} isPressable={false} />)

    expect(screen.getByText('Scanning…')).toBeTruthy()

    fireEvent.press(screen.getByTestId('scan-for-new-networks'))
    expect(baseProps.onScan).not.toHaveBeenCalled()
  })

  it('shows the chain names of newly discovered networks after a successful scan', () => {
    render(
      <NetworksSheetFooter {...baseProps} phase="idle" lastResult={{ newChainIds: ['137'], scannedAt: Date.now() }} />,
    )

    expect(screen.getByText('Found 1 new network: Polygon')).toBeTruthy()
  })

  it('shows an empty-result message when no chains were discovered', () => {
    render(<NetworksSheetFooter {...baseProps} phase="idle" lastResult={{ newChainIds: [], scannedAt: Date.now() }} />)

    expect(screen.getByText('No new networks found')).toBeTruthy()
  })

  it('shows the error label and message in the error phase', () => {
    render(<NetworksSheetFooter {...baseProps} phase="error" lastResult={null} errorMessage="Network request failed" />)

    expect(screen.getByText('Scan failed — tap to retry')).toBeTruthy()
    expect(screen.getByText('Network request failed')).toBeTruthy()
  })
})
