import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '../calendar'

/**
 * Calendar Component Stories
 *
 * Date picker built on react-day-picker (v9), styled with shadcn tokens.
 * Shown in its single, range, and multiple selection modes.
 */
const meta = {
  title: 'UI/Calendar',
  component: Calendar,
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

const DEFAULT_MONTH = new Date(2026, 0, 1)

const SingleDemo = () => {
  const [selected, setSelected] = useState<Date | undefined>(new Date(2026, 0, 15))
  return <Calendar mode="single" defaultMonth={DEFAULT_MONTH} selected={selected} onSelect={setSelected} />
}

const RangeDemo = () => {
  const [selected, setSelected] = useState<DateRange | undefined>({
    from: new Date(2026, 0, 10),
    to: new Date(2026, 0, 16),
  })
  return <Calendar mode="range" defaultMonth={DEFAULT_MONTH} selected={selected} onSelect={setSelected} />
}

const MultipleDemo = () => {
  const [selected, setSelected] = useState<Date[] | undefined>([
    new Date(2026, 0, 5),
    new Date(2026, 0, 12),
    new Date(2026, 0, 20),
  ])
  return <Calendar mode="multiple" defaultMonth={DEFAULT_MONTH} selected={selected} onSelect={setSelected} />
}

export const AllVariants: Story = {
  tags: ['!chromatic'],
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Single</h3>
        <SingleDemo />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Range</h3>
        <RangeDemo />
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold">Multiple</h3>
        <MultipleDemo />
      </div>
    </div>
  ),
}
