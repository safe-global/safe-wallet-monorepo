import { fireEvent } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as editorData from '../hooks/useFeatureFlagEditorData'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagEditor } from './FeatureFlagEditor'

const row = (feature: FEATURES, override?: boolean): FeatureFlagRowData => ({
  feature,
  chainScope: 'off',
  configValue: false,
  override,
  effective: override ?? false,
  matchesCurrentChain: false,
})

const mockData = (overridden: FeatureFlagRowData[], rest: FeatureFlagRowData[]) =>
  jest.spyOn(editorData, 'useFeatureFlagEditorData').mockReturnValue({ overridden, rest })

describe('FeatureFlagEditor', () => {
  afterEach(() => jest.restoreAllMocks())

  it('filters rows by the search query', () => {
    mockData([], [row(FEATURES.EARN), row(FEATURES.BRIDGE)])
    const { getByLabelText, getByText, queryByText } = render(<FeatureFlagEditor />)

    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
    expect(getByText(FEATURES.BRIDGE)).toBeInTheDocument()

    fireEvent.change(getByLabelText('Search flags'), { target: { value: 'earn' } })

    expect(getByText(FEATURES.EARN)).toBeInTheDocument()
    expect(queryByText(FEATURES.BRIDGE)).not.toBeInTheDocument()
  })

  it('explains that a search matched nothing', () => {
    mockData([], [row(FEATURES.EARN)])
    const { getByLabelText, getByText, queryByText } = render(<FeatureFlagEditor />)

    expect(queryByText('No feature flags match your search.')).not.toBeInTheDocument()

    fireEvent.change(getByLabelText('Search flags'), { target: { value: 'nothing-matches-this' } })

    expect(getByText('No feature flags match your search.')).toBeInTheDocument()
    expect(queryByText('All feature flags')).not.toBeInTheDocument()
  })

  it('does not show the empty search message when there are simply no flags', () => {
    mockData([], [])
    const { queryByText } = render(<FeatureFlagEditor />)

    expect(queryByText('No feature flags match your search.')).not.toBeInTheDocument()
  })

  it('keeps showing matches in one section when the other has none', () => {
    mockData([row(FEATURES.EARN, true)], [row(FEATURES.BRIDGE)])
    const { getByLabelText, getByText, queryByText } = render(<FeatureFlagEditor />)

    fireEvent.change(getByLabelText('Search flags'), { target: { value: 'earn' } })

    expect(getByText('Local overrides')).toBeInTheDocument()
    expect(queryByText('All feature flags')).not.toBeInTheDocument()
    expect(queryByText('No feature flags match your search.')).not.toBeInTheDocument()
  })

  it('omits the local overrides section when there are none', () => {
    mockData([], [row(FEATURES.EARN)])
    const { queryByText } = render(<FeatureFlagEditor />)
    expect(queryByText('Local overrides')).not.toBeInTheDocument()
    expect(queryByText('All feature flags')).toBeInTheDocument()
  })

  it('renders no page chrome — the dialog shell owns the heading and reset action', () => {
    mockData([row(FEATURES.EARN, true)], [row(FEATURES.BRIDGE)])
    const { queryByRole } = render(<FeatureFlagEditor />)

    expect(queryByRole('heading')).not.toBeInTheDocument()
    expect(queryByRole('button', { name: 'Reset all overrides' })).not.toBeInTheDocument()
  })
})
