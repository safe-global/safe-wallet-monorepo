import React from 'react'
import { render, screen } from '@testing-library/react'
import FilteredSafes from './index'
import SafesList from '@/features/myAccounts/components/SafesList'
import type { AllSafeItems } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import * as safesSearch from '@/features/myAccounts/hooks/useSafesSearch'

jest.mock('@/features/myAccounts/components/SafesList', () => jest.fn(() => <div data-testid="safes-list" />))

describe('FilteredSafes', () => {
  beforeEach(() => {
    jest.spyOn(safesSearch, 'useSafesSearch').mockReturnValue([])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('displays the correct heading when no results are found', () => {
    const allSafes: AllSafeItems = []

    render(<FilteredSafes searchQuery="test" allSafes={allSafes} />)

    expect(screen.getByText('Found 0 results')).toBeInTheDocument()
    // SafesList should be rendered with empty array
    const safesListProps = (SafesList as jest.Mock).mock.calls[0][0]
    expect(safesListProps.safes).toHaveLength(0)
  })

  it('displays the correct heading when one result is found', () => {
    const oneSafe = [
      { address: '0x1', name: 'Safe1', isPinned: false, chainId: '1', isReadOnly: false, lastVisited: 0 },
    ]
    jest.spyOn(safesSearch, 'useSafesSearch').mockReturnValue(oneSafe)

    const allSafes: AllSafeItems = oneSafe

    render(<FilteredSafes searchQuery="safe" allSafes={allSafes} />)

    // With one result, should say "Found 1 result" (singular)
    expect(screen.getByText('Found 1 result')).toBeInTheDocument()

    const safesListProps = (SafesList as jest.Mock).mock.calls[0][0]
    expect(safesListProps.safes).toEqual(oneSafe)
  })

  it('displays the correct heading when multiple results are found', () => {
    const multiSafes = [
      { name: 'SafeA', address: '0xA', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0 },
      { name: 'SafeB', address: '0xB', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0 },
    ]
    jest.spyOn(safesSearch, 'useSafesSearch').mockReturnValue(multiSafes)

    const allSafes: AllSafeItems = multiSafes

    render(<FilteredSafes searchQuery="multi" allSafes={allSafes} />)

    // With two results, should say "Found 2 results" (plural)
    expect(screen.getByText('Found 2 results')).toBeInTheDocument()

    const safesListProps = (SafesList as jest.Mock).mock.calls[0][0]
    expect(safesListProps.safes).toEqual(multiSafes)
  })

  it('passes onLinkClick down to SafesList', () => {
    const safes = [{ name: 'Safe1', address: '0x1', chainId: '1', isPinned: false, isReadOnly: false, lastVisited: 0 }]
    jest.spyOn(safesSearch, 'useSafesSearch').mockReturnValue(safes)
    const allSafes: AllSafeItems = safes
    const onLinkClickMock = jest.fn()

    render(<FilteredSafes searchQuery="safe" allSafes={allSafes} onLinkClick={onLinkClickMock} />)

    const safesListProps = (SafesList as jest.Mock).mock.calls[0][0]
    expect(safesListProps.onLinkClick).toBe(onLinkClickMock)
  })
})
