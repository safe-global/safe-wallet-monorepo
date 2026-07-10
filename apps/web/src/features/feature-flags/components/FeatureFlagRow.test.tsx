import { render, fireEvent } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { getStoreInstance } from '@/store'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

// The base-ui Switch doesn't toggle reliably in jsdom, so mock it with a plain
// checkbox that forwards onCheckedChange — this pins our dispatch wiring, which
// is the point of these tests (the real Switch is covered by its own tests).
jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
  }: {
    checked: boolean
    onCheckedChange: (value: boolean) => void
    'aria-label'?: string
  }) => (
    <input
      role="switch"
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}))

const baseRow: FeatureFlagRowData = {
  feature: FEATURES.EARN,
  chainScope: 'global',
  configValue: false,
  override: undefined,
  effective: false,
  matchesCurrentChain: false,
}

describe('FeatureFlagRow', () => {
  it('renders the flag constant', () => {
    const { getByText } = render(<FeatureFlagRow row={baseRow} />)
    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
  })

  it('shows the switch checked when the effective value is true', () => {
    const { getByRole } = render(<FeatureFlagRow row={{ ...baseRow, effective: true }} />)
    expect(getByRole('switch')).toBeChecked()
  })

  // The revert button and match indicator only render for overridden rows.
  it('shows the revert button only for overridden rows', () => {
    const { queryByTestId, rerender } = render(<FeatureFlagRow row={baseRow} />)
    expect(queryByTestId('ff-revert-override')).not.toBeInTheDocument()
    rerender(<FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />)
    expect(queryByTestId('ff-revert-override')).toBeInTheDocument()
  })

  // Within an overridden row the match indicator stays in the DOM and is toggled
  // via `visibility`, so this case asserts visibility rather than presence.
  it('shows the match indicator only when the override matches the current chain config', () => {
    const { getByTestId, rerender } = render(<FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />)
    expect(getByTestId('ff-match-indicator')).not.toBeVisible()
    rerender(
      <FeatureFlagRow
        row={{ ...baseRow, override: true, configValue: true, effective: true, matchesCurrentChain: true }}
      />,
    )
    expect(getByTestId('ff-match-indicator')).toBeVisible()
  })

  it('dispatches setOverride when the switch is toggled', () => {
    const { getByRole } = render(<FeatureFlagRow row={baseRow} />)
    fireEvent.click(getByRole('switch'))
    expect(getStoreInstance().getState().featureFlagOverrides).toEqual({ [FEATURES.EARN]: true })
  })

  it('dispatches clearOverride when the revert button is clicked', () => {
    const { getByTestId } = render(<FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />, {
      initialReduxState: { featureFlagOverrides: { [FEATURES.EARN]: true } },
    })
    fireEvent.click(getByTestId('ff-revert-override'))
    expect(getStoreInstance().getState().featureFlagOverrides).toEqual({})
  })
})
