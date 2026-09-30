import { render, screen } from '@/tests/test-utils'
import { AddressPoisoningCardItem } from '../AddressPoisoningCardItem'
import { RecipientStatus, Severity, type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'

const ENTERED = '0xa1b2ffffffffffffffffffffffffffffffff5678'
const ANCHOR = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'

const baseResult: AnalysisResult = {
  severity: Severity.CRITICAL,
  type: RecipientStatus.RESEMBLES_TRUSTED_ADDRESS,
  title: 'Potential address poisoning',
  description: 'The address you entered looks similar to your saved address contact. Please verify before you proceed.',
  addresses: [{ address: ENTERED }, { address: ANCHOR, name: 'Alice' }],
}

describe('AddressPoisoningCardItem', () => {
  it('shows the description, both labels and no "Show all" toggle', () => {
    render(<AddressPoisoningCardItem result={baseResult} />)

    expect(screen.getByText(baseResult.description)).toBeInTheDocument()
    expect(screen.getByText('Address entered')).toBeInTheDocument()
    expect(screen.getByText('Saved address: Alice')).toBeInTheDocument()
    expect(screen.queryByText('Show all')).not.toBeInTheDocument()
  })

  it('falls back to "Saved address" when the trusted anchor has no local name', () => {
    render(
      <AddressPoisoningCardItem result={{ ...baseResult, addresses: [{ address: ENTERED }, { address: ANCHOR }] }} />,
    )

    expect(screen.getByText('Saved address')).toBeInTheDocument()
    expect(screen.queryByText(/Saved address:/)).not.toBeInTheDocument()
  })

  it('bolds the shared front and back of both addresses', () => {
    const { container } = render(<AddressPoisoningCardItem result={baseResult} />)

    // entered + anchor share 'a1b2' front and '5678' back → both bolded on each row (4 bold spans)
    const bolds = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(bolds).toEqual(['a1b2', '5678', 'a1b2', '5678'])
  })
})
