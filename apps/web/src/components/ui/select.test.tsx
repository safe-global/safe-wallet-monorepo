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
  it('falls back to the default size', () => {
    const trigger = renderTrigger()

    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute('data-size', 'default')
  })

  it.each(['sm', 'default', 'lg'] as const)('reflects size=%s as a data attribute', (size) => {
    const trigger = renderTrigger({ size })

    expect(trigger).toHaveAttribute('data-size', size)
  })
})
