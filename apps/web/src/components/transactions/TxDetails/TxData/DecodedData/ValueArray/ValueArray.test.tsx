import { Value } from '.'
import { render, waitFor } from '@/tests/test-utils'

describe('ValueArray', () => {
  it('should render Snapshot Proposal', async () => {
    const result = render(<Value type="string[]" value='[\n  "Yes",\n  "No"\n]' method="Proposal" />)

    await waitFor(() => {
      expect(result.queryByText('[', { exact: false })).toBeInTheDocument()
      expect(result.queryByText('Yes', { exact: false })).toBeInTheDocument()
      expect(result.queryByText('No', { exact: false })).toBeInTheDocument()
      expect(result.queryByText(']', { exact: false })).toBeInTheDocument()
    })
  })
})
