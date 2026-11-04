import { faker } from '@faker-js/faker'
import { render, screen, fireEvent, fakerChecksummedAddress } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { Dialog, DialogContent } from '@safe-global/views/components/ui/dialog'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'

describe('SelectAllConfirmDialog', () => {
  const similarAddresses = [
    { address: fakerChecksummedAddress(), name: faker.company.name() },
    { address: fakerChecksummedAddress(), name: faker.company.name() },
  ]

  const defaultProps = {
    open: true,
    similarAddresses,
    onConfirm: jest.fn(),
    onSkip: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
  })

  it('lists every flagged address with its name', () => {
    render(<SelectAllConfirmDialog {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    for (const { address, name } of similarAddresses) {
      expect(dialog).toHaveTextContent(address)
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('calls onSkip when the similar addresses are skipped', () => {
    render(<SelectAllConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('No, skip similar addresses'))

    expect(defaultProps.onSkip).toHaveBeenCalled()
  })

  it('calls onConfirm when the similar addresses are included anyway', () => {
    render(<SelectAllConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByText('Yes, include them anyway'))

    expect(defaultProps.onConfirm).toHaveBeenCalled()
  })

  it('shows the addresses without a chain prefix', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().with({ shortName: 'eth' }).build())

    render(<SelectAllConfirmDialog {...defaultProps} />)

    expect(screen.queryAllByText('eth:')).toHaveLength(0)
  })

  it('bolds the first and last four hex characters of each address', () => {
    render(<SelectAllConfirmDialog {...defaultProps} />)

    const bold = Array.from(screen.getByRole('dialog').querySelectorAll('b')).map((b) => b.textContent)
    expect(bold).toEqual(similarAddresses.flatMap(({ address }) => [address.slice(2, 6), address.slice(-4)]))
  })

  it('shows a backdrop when opened from inside another dialog', () => {
    render(
      <Dialog open>
        <DialogContent>
          <SelectAllConfirmDialog {...defaultProps} />
        </DialogContent>
      </Dialog>,
    )

    expect(document.querySelectorAll('[data-slot="dialog-overlay"]')).toHaveLength(2)
  })

  it('uses the given description, question and confirm label', () => {
    const copy = {
      description: faker.lorem.sentence(),
      question: faker.lorem.sentence(),
      confirmLabel: faker.lorem.words(3),
    }

    render(<SelectAllConfirmDialog {...defaultProps} {...copy} />)

    expect(screen.getByText(copy.description)).toBeInTheDocument()
    expect(screen.getByText(copy.question)).toBeInTheDocument()
    expect(screen.getByText(copy.confirmLabel)).toBeInTheDocument()
    expect(screen.queryByText('Yes, include them anyway')).not.toBeInTheDocument()
  })
})
