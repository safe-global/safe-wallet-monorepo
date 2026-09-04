import { render, screen } from '@/tests/test-utils'
import CloudCosignerBadge from '.'
import { CLOUD_COSIGNER_NAME } from '../../constants'

describe('CloudCosignerBadge', () => {
  it('renders the cosigner label', () => {
    render(<CloudCosignerBadge />)

    expect(screen.getByTestId('cloud-cosigner-badge')).toHaveTextContent(CLOUD_COSIGNER_NAME)
  })
})
