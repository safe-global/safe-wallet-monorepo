import { render } from '@testing-library/react'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { ShortAddressWithTooltip } from './shared'

const ADDRESS = '0xabcd567890123456789012345678901234567890'

const bothEndsMatch: SimilarityMatch = { anchor: '', prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL }
const frontOnlyMatch: SimilarityMatch = { anchor: '', prefixLen: 4, suffixLen: 0, severity: Severity.WARN }

describe('ShortAddressWithTooltip', () => {
  it('renders the shortened address as plain text when there is no similarity match', () => {
    const { container } = render(<ShortAddressWithTooltip address={ADDRESS} />)

    expect(container.textContent).toContain('0xabcd...7890')
    expect(container.querySelectorAll('b')).toHaveLength(0)
  })

  it('highlights both visible ends when the anchor match hits front and back', () => {
    const { container } = render(<ShortAddressWithTooltip address={ADDRESS} similarity={bothEndsMatch} />)

    const bolded = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(bolded).toEqual(['abcd', '7890'])
    expect(container.textContent).toContain('0xabcd...7890')
  })

  it('highlights only the front group when the anchor match hits the front only', () => {
    const { container } = render(<ShortAddressWithTooltip address={ADDRESS} similarity={frontOnlyMatch} />)

    const bolded = Array.from(container.querySelectorAll('b')).map((el) => el.textContent)
    expect(bolded).toEqual(['abcd'])
    expect(container.textContent).toContain('0xabcd...7890')
  })
})
