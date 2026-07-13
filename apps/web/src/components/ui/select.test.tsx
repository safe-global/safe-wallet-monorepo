import type { ComponentProps } from 'react'
import { render } from '@testing-library/react'
import { Select, SelectTrigger, SelectValue } from './select'

type TriggerProps = ComponentProps<typeof SelectTrigger>

const renderTrigger = (props: Omit<TriggerProps, 'children'> = {}) => {
  const { container } = render(
    <Select>
      <SelectTrigger {...props}>
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
    </Select>,
  )
  const trigger = container.querySelector('[data-slot="select-trigger"]')
  if (!trigger) throw new Error('SelectTrigger did not render')
  return trigger
}

describe('SelectTrigger', () => {
  it('renders the surface variant as a bg-card rounded filter select', () => {
    const trigger = renderTrigger({ variant: 'surface' })

    expect(trigger).toHaveClass('bg-card', 'rounded-lg', 'border-border', 'shadow-none')
  })

  it('renders the ghost variant with borders and background reset', () => {
    const trigger = renderTrigger({ variant: 'ghost' })

    expect(trigger).toHaveClass('border-0', 'bg-transparent', 'shadow-none', 'px-0', 'py-0')
  })

  it('drives height off the data-size attribute (default)', () => {
    const trigger = renderTrigger()

    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('data-size', 'default')
    // height is applied via the data-[size] selector baked into the base string
    expect(trigger).toHaveClass('data-[size=default]:h-9')
  })

  it('drives height off the data-size attribute (lg → h-10)', () => {
    const trigger = renderTrigger({ size: 'lg' })

    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('data-size', 'lg')
    expect(trigger).toHaveClass('data-[size=lg]:h-10')
  })
})
