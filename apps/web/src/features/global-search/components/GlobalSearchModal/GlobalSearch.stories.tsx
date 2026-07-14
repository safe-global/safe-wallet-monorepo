import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { useState } from 'react'

import GlobalSearch from './GlobalSearch'

const meta = {
  title: 'Features/GlobalSearch/GlobalSearch',
  component: GlobalSearch,
  parameters: {
    layout: 'centered',
  },
  args: {
    value: '',
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GlobalSearch>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Empty search field with the placeholder visible.
 */
export const Empty: Story = {}

/**
 * Search field pre-populated with a query.
 */
export const WithValue: Story = {
  args: {
    value: 'Ethereum',
  },
}

/**
 * Interactive controlled example: typing updates the field's value in real time.
 */
export const Interactive: Story = {
  render: (args) => {
    const InteractiveWrapper = () => {
      const [value, setValue] = useState('')
      return (
        <GlobalSearch
          {...args}
          value={value}
          onChange={(next) => {
            setValue(next)
            args.onChange(next)
          }}
        />
      )
    }
    return <InteractiveWrapper />
  },
}
