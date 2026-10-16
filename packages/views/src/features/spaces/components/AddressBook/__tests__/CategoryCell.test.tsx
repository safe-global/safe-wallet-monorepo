import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryCell from '../CategoryCell'

describe('CategoryCell', () => {
  it.each([
    ['workspace-safe', 'Workspace Safe'],
    ['safe', 'Safe account'],
    ['contract', 'Contract'],
    ['eoa', 'EOA'],
  ] as const)('renders the %s chip as "%s"', (category, label) => {
    render(<CategoryCell category={category} />)

    expect(screen.getByTestId(`category-${category}`)).toHaveTextContent(label)
  })

  it('names the first two Safes and summarises the rest', () => {
    render(<CategoryCell category="eoa" signerOf={['Treasury', 'Payroll', 'Ops', 'Grants']} />)

    expect(screen.getByTestId('category-signer-of')).toHaveTextContent('Signer of Treasury, Payroll +2')
  })

  it('names every Safe when there are two or fewer', () => {
    render(<CategoryCell category="eoa" signerOf={['Treasury', 'Payroll']} />)

    expect(screen.getByTestId('category-signer-of')).toHaveTextContent(/^Signer of Treasury, Payroll$/)
  })

  it('shows no signer line when the contact signs nothing', () => {
    render(<CategoryCell category="eoa" />)

    expect(screen.queryByTestId('category-signer-of')).not.toBeInTheDocument()
  })

  it('shows a dash for an unknown address and checks again on click', async () => {
    const onRetry = jest.fn()
    render(<CategoryCell category="unknown" onRetry={onRetry} />)

    expect(screen.getByLabelText('Not sure')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides Check again when no retry handler is given', () => {
    render(<CategoryCell category="unknown" />)

    expect(screen.getByTestId('category-unknown')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check again' })).not.toBeInTheDocument()
  })

  it('renders a skeleton while the category is loading', () => {
    render(<CategoryCell category="loading" signerOf={['Treasury']} />)

    expect(screen.getByTestId('category-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('category-signer-of')).not.toBeInTheDocument()
  })
})
