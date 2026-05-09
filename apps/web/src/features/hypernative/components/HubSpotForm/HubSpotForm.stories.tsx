import type { Meta, StoryObj } from '@storybook/react'
import HubSpotForm from './HubSpotForm'

const meta = {
  component: HubSpotForm,
  title: 'Features/Hypernative/HubSpotForm',
  tags: ['autodocs'],
} satisfies Meta<typeof HubSpotForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    portalId: '145395469',
    formId: '66bf6e3e-085b-444a-87bd-4d3dcfe2d195',
  },
}
