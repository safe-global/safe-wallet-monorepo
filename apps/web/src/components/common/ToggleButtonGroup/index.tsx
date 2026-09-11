import type { ReactNode, ReactElement } from 'react'
import React from 'react'
import { Toggle } from '@/components/ui/toggle'

interface ToggleButtonGroupProps {
  value?: number
  children: {
    title: ReactNode
    content: ReactNode
  }[]
  onChange?: (newValue: number) => void
}

export const ToggleButtonGroup = ({ value = 0, children, onChange }: ToggleButtonGroupProps): ReactElement | null => {
  const [currentValue, setCurrentValue] = React.useState(value)

  const changeView = (newValue: number) => {
    if (newValue !== currentValue) {
      setCurrentValue(newValue)
      onChange?.(newValue)
    }
  }

  return (
    <div
      role="group"
      aria-label="text alignment"
      className="inline-flex gap-1 rounded-md bg-[var(--color-background-paper)] p-0.5 [&_svg]:size-4"
    >
      {children.map(({ title }, index) => (
        <Toggle
          key={index}
          size="sm"
          pressed={currentValue === index}
          onPressedChange={() => changeView(index)}
          className="rounded-md border-0 px-2 py-0.5"
        >
          <span className="px-1">{title}</span>
        </Toggle>
      ))}
    </div>
  )
}
