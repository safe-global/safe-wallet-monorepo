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
  it('renders the ghost variant with borders and background reset', () => {
    const trigger = renderTrigger({ variant: 'ghost' })

    expect(trigger).toHaveClass('border-0', 'bg-transparent', 'shadow-none', 'px-0', 'py-0')
  })

  it('applies a single min-height via the data-size hook', () => {
    const trigger = renderTrigger()

    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('data-size', 'default')
    // one height (min-h-9) baked into the base string — it grows for rich multi-line values
    expect(trigger).toHaveClass('data-[size=default]:min-h-9')
  })
})
