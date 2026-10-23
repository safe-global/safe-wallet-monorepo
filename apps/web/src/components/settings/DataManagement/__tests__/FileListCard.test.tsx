import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import { FileListCard } from '../FileListCard'

const safe = { owners: [], threshold: 1 }

describe('FileListCard', () => {
  it('counts the chains of the added Safes and of the address book', () => {
    render(
      <FileListCard
        addedSafes={{ '1': { [fakerChecksummedAddress()]: safe }, '11155111': { [fakerChecksummedAddress()]: safe } }}
        addressBook={{ '11155111': { [fakerChecksummedAddress()]: 'Treasury' } }}
        settings={settingsInitialState}
      />,
    )

    expect(screen.getByText('Added Safe accounts', { exact: false }).closest('li')).toHaveTextContent(
      'Added Safe accounts on 2 chains',
    )
    expect(screen.getByText('Address book', { exact: false }).closest('li')).toHaveTextContent(
      'Address book for 1 chain',
    )
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('lists the bookmarked Safe Apps only when a chain has pinned apps', () => {
    const { unmount } = render(<FileListCard safeApps={{ '11155111': { pinned: [24], opened: [] } }} />)
    expect(screen.getByText('Safe Apps').closest('li')).toHaveTextContent('Bookmarked Safe Apps')
    unmount()

    render(<FileListCard safeApps={{ '11155111': { pinned: [], opened: [24] } }} />)
    expect(screen.queryByText('Safe Apps')).not.toBeInTheDocument()
  })
})
