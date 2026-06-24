import { render, screen, fireEvent } from '@/tests/test-utils'
import type { SafeItem } from '@/hooks/safes'
import SelectSafesModal from '../index'

const SAFE_A = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326'
const SAFE_B = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const SAFE_C = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'

const makeSafe = (address: string, name: string): SafeItem => ({
  address,
  chainId: '1',
  name,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
})

const MOCK_SAFES = [makeSafe(SAFE_A, 'My account'), makeSafe(SAFE_B, 'Treasury'), makeSafe(SAFE_C, 'A longer name')]

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: () => ({ allSafes: MOCK_SAFES, isLoading: false }),
}))

jest.mock('@/hooks/safes/useSafesSearch', () => ({
  useSafesSearch: (safes: SafeItem[], query: string) =>
    query ? safes.filter((s) => s.name?.toLowerCase().includes(query.toLowerCase())) : [],
}))

jest.mock('../../../SelectSafesOnboarding/hooks/useSafeCardData', () => ({
  __esModule: true,
  default: (safe: SafeItem) => ({ name: safe.name, fiatValue: '1000', chainIds: ['1'] }),
}))

jest.mock('@/features/multichain/components/NetworkLogosList', () => ({
  __esModule: true,
  default: () => <div data-testid="network-logos" />,
}))

describe('SelectSafesModal', () => {
  const renderModal = (props: Partial<React.ComponentProps<typeof SelectSafesModal>> = {}) => {
    const onSave = jest.fn()
    const onClose = jest.fn()
    render(<SelectSafesModal open onClose={onClose} initialSelected={[]} onSave={onSave} {...props} />)
    return { onSave, onClose }
  }

  it('renders the title, subtitle and one row per safe', () => {
    renderModal()
    expect(screen.getByText('Select Safes for your plan')).toBeInTheDocument()
    expect(screen.getByText(/Choose which safes you want to include/)).toBeInTheDocument()
    expect(screen.getByText('My account')).toBeInTheDocument()
    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('A longer name')).toBeInTheDocument()
  })

  it('pre-checks rows from initialSelected', () => {
    renderModal({ initialSelected: [SAFE_A] })
    expect(screen.getByRole('checkbox', { name: 'Select My account' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Treasury' })).not.toBeChecked()
  })

  it('toggles a row selection on click', () => {
    renderModal()
    const row = screen.getByRole('checkbox', { name: 'Select Treasury' })
    expect(row).not.toBeChecked()
    fireEvent.click(row)
    expect(row).toBeChecked()
  })

  it('select-all checks every row', () => {
    renderModal()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all safes' }))
    expect(screen.getByRole('checkbox', { name: 'Select My account' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Treasury' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select A longer name' })).toBeChecked()
  })

  it('filters rows by the search query', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText('Search for safes'), { target: { value: 'treasury' } })
    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.queryByText('My account')).not.toBeInTheDocument()
  })

  it('Save reports the selected addresses and closes', () => {
    const { onSave, onClose } = renderModal({ initialSelected: [SAFE_A] })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Treasury' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith([SAFE_A.toLowerCase(), SAFE_B.toLowerCase()])
    expect(onClose).toHaveBeenCalled()
  })
})
