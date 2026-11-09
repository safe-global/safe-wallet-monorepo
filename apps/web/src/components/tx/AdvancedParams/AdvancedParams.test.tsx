import { render, screen } from '@/tests/test-utils'
import AdvancedParams from './index'

jest.mock('@/components/tx/GasParams', () => ({
  __esModule: true,
  default: ({ onEdit }: { onEdit?: () => void }) => (onEdit ? <button onClick={onEdit}>Edit</button> : null),
}))

const PARAMS = { userNonce: 1, gasLimit: 100000n }

describe('AdvancedParams', () => {
  it('lets the executor edit the params', () => {
    render(<AdvancedParams willExecute params={PARAMS} onFormSubmit={jest.fn()} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('shows the params without an edit action when the Safe pays the relayer', () => {
    render(<AdvancedParams willExecute willRelay isReadOnly params={PARAMS} onFormSubmit={jest.fn()} />)

    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })
})
