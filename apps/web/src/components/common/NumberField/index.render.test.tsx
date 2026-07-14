import { render } from '@testing-library/react'

import NumberField from './index'

describe('NumberField rendering', () => {
  it('passes inputSize and variant to a plain input', () => {
    const { container } = render(<NumberField label="Amount" inputSize="xl" variant="surface" />)

    expect(container.querySelector('[data-slot="input"]')).toHaveClass('h-[66px]', 'bg-card')
  })

  it('passes inputSize and variant to an adorned input group', () => {
    const { container } = render(
      <NumberField aria-label="Amount" startAdornment="$" inputSize="xl" variant="surface" />,
    )

    expect(container.querySelector('[data-slot="input-group"]')).toHaveClass('h-[66px]', 'bg-card')
  })
})
