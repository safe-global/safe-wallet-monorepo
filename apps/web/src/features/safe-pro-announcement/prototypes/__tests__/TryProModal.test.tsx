import { fireEvent, render, screen } from '@/tests/test-utils'
import type { PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { TryProModal, _fittingSize, _sizesOf } from '../TryProModal'

const option = (seats: number, price: number) => ({
  paymentLinkId: `pl_${seats}`,
  priceId: `price_${seats}`,
  label: `${seats} Safe accounts`,
  seats,
  price,
  originalPrice: null,
})
const tier = (name: string, options: ReturnType<typeof option>[]): PlanTier => ({
  id: `${name}-month`,
  name,
  currency: 'eur',
  billingCycle: 'month',
  options,
  features: [`${name} feature`],
})
const TIERS = [tier('Business', [option(20, 400), option(5, 100)]), tier('Starter', [option(2, 50)])]

describe('TryProModal', () => {
  it('lists the sizes smallest first and picks the smallest that holds every Safe', () => {
    const sizes = _sizesOf(TIERS)

    expect(sizes.map((size) => size.option.seats)).toEqual([2, 5, 20])
    expect(_fittingSize(sizes, 1)?.option.seats).toBe(2)
    expect(_fittingSize(sizes, 3)?.option.seats).toBe(5)
    expect(_fittingSize(sizes, 50)?.option.seats).toBe(20)
  })

  it('shows the fitting plan, switches with the size tabs, and reports the picked size', () => {
    const onStartTrial = jest.fn()
    render(<TryProModal tiers={TIERS} safeCount={3} reason="Because" onClose={jest.fn()} onStartTrial={onStartTrial} />)

    expect(screen.getByRole('heading')).toHaveTextContent('Try Safe Pro Business')
    expect(screen.getByText('Because')).toBeInTheDocument()
    expect(screen.getByText('5 Safe accounts')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('try-pro-size-2'))
    expect(screen.getByRole('heading')).toHaveTextContent('Try Safe Pro Starter')

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(onStartTrial).toHaveBeenCalledWith(
      expect.objectContaining({ option: expect.objectContaining({ seats: 2 }) }),
    )
  })

  it('closes on Not now', () => {
    const onClose = jest.fn()
    render(<TryProModal tiers={TIERS} safeCount={3} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onClose).toHaveBeenCalled()
  })
})
