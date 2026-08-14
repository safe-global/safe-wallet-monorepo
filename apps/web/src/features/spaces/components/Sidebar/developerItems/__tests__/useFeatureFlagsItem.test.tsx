import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useFeatureFlagsItem } from '../useFeatureFlagsItem'

const mockUseAppSelector = jest.fn()

jest.mock('@/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))

jest.mock('@/features/feature-flag-overrides/FeatureFlagEditorDialogLoader', () => ({
  FeatureFlagEditorDialogLoader: ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) =>
    open ? (
      <div data-testid="feature-flag-editor-dialog">
        <button type="button" onClick={() => onOpenChange(false)}>
          Close editor
        </button>
      </div>
    ) : null,
}))

// The hook returns its dialog as part of its state, so drive it through a host component the way
// SidebarDeveloperItem does rather than inspecting the returned element.
const Host = () => {
  const { badge, onSelect, dialog } = useFeatureFlagsItem()
  return (
    <>
      <button type="button" onClick={onSelect}>
        Feature flags
      </button>
      {badge !== undefined && <span data-testid="badge">{badge}</span>}
      {dialog}
    </>
  )
}

describe('useFeatureFlagsItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppSelector.mockReturnValue(0)
  })

  it('badges the entry with the override count', () => {
    mockUseAppSelector.mockReturnValue(4)

    const { result } = renderHook(() => useFeatureFlagsItem())

    expect(result.current.badge).toBe(4)
  })

  it('leaves the badge unset when nothing is overridden', () => {
    const { result } = renderHook(() => useFeatureFlagsItem())

    expect(result.current.badge).toBeUndefined()
  })

  it('keeps onSelect stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useFeatureFlagsItem())

    const firstOnSelect = result.current.onSelect
    rerender()

    expect(result.current.onSelect).toBe(firstOnSelect)
  })

  it('keeps its dialog closed until the entry is selected', () => {
    render(<Host />)

    expect(screen.queryByTestId('feature-flag-editor-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Feature flags' }))

    expect(screen.getByTestId('feature-flag-editor-dialog')).toBeInTheDocument()
  })

  it('lets the dialog close itself again', () => {
    render(<Host />)

    fireEvent.click(screen.getByRole('button', { name: 'Feature flags' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }))

    expect(screen.queryByTestId('feature-flag-editor-dialog')).not.toBeInTheDocument()
  })
})
