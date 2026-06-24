import { act, render, screen } from '@/tests/test-utils'
import { useRenameSafe } from '../useRenameSafe'
import type { RenameTarget } from '../../components/RenameSafe/types'

const target: RenameTarget = {
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  chainIds: ['1'],
  currentName: 'Old',
  isSpaceSafe: false,
  spaceId: null,
}

function Harness() {
  const { openRename, renameDialog, isRenameOpen } = useRenameSafe()
  return (
    <>
      <button data-testid="open" onClick={() => openRename(target)}>
        open
      </button>
      <span data-testid="is-open">{String(isRenameOpen)}</span>
      {renameDialog}
    </>
  )
}

describe('useRenameSafe', () => {
  it('renders no dialog until openRename is called', () => {
    render(<Harness />)
    expect(screen.queryByTestId('rename-safe-dialog')).not.toBeInTheDocument()
  })

  it('opens the dialog with the given target', () => {
    render(<Harness />)
    act(() => {
      screen.getByTestId('open').click()
    })
    expect(screen.getByTestId('rename-safe-dialog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Old')).toBeInTheDocument()
  })

  it('closes the dialog on cancel', () => {
    render(<Harness />)
    act(() => screen.getByTestId('open').click())
    act(() => screen.getByTestId('cancel-btn').click())
    expect(screen.queryByTestId('rename-safe-dialog')).not.toBeInTheDocument()
  })

  it('reflects open state via isRenameOpen', () => {
    render(<Harness />)
    expect(screen.getByTestId('is-open')).toHaveTextContent('false')
    act(() => screen.getByTestId('open').click())
    expect(screen.getByTestId('is-open')).toHaveTextContent('true')
    act(() => screen.getByTestId('cancel-btn').click())
    expect(screen.getByTestId('is-open')).toHaveTextContent('false')
  })
})
