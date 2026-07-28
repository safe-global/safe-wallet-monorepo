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

  it('applies the default min-height via the data-size hook', () => {
    const trigger = renderTrigger()

    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('data-size', 'default')
    // min-h (not h) so the trigger still grows for rich multi-line values
    expect(trigger).toHaveClass('data-[size=default]:min-h-9')
  })

  it.each([
    ['sm', 'data-[size=sm]:min-h-8'],
    ['default', 'data-[size=default]:min-h-9'],
    ['lg', 'data-[size=lg]:min-h-10'],
  ] as const)('matches Button/Input heights at size=%s', (size, expected) => {
    const trigger = renderTrigger({ size })

    expect(trigger).toHaveAttribute('data-size', size)
    expect(trigger).toHaveClass(expected)
  })
})
