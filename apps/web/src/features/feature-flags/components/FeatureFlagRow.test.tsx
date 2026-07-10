import { render } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

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

  // The revert button and match indicator stay in the DOM for stable column
  // alignment and are hidden via `visibility` — so we assert visibility, not presence.
  it('shows the revert button only for overridden rows', () => {
    const { getByLabelText, rerender } = render(<FeatureFlagRow row={baseRow} />)
    expect(getByLabelText('Revert override')).not.toBeVisible()
    rerender(<FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />)
    expect(getByLabelText('Revert override')).toBeVisible()
  })

  it('shows the match indicator only when the override matches the current chain config', () => {
    const label = 'Matches config service setting for the current chain'
    const { getByLabelText, rerender } = render(
      <FeatureFlagRow row={{ ...baseRow, override: true, effective: true }} />,
    )
    expect(getByLabelText(label)).not.toBeVisible()
    rerender(
      <FeatureFlagRow
        row={{ ...baseRow, override: true, configValue: true, effective: true, matchesCurrentChain: true }}
      />,
    )
    expect(getByLabelText(label)).toBeVisible()
  })
})
